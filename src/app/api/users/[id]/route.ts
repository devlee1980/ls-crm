import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import bcrypt from "bcryptjs";

const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).max(128).optional().nullable(),
  role: z.enum(["ADMIN", "MANAGER", "REP", "CS_REP"]).optional(),
  division: z.enum(["LS_US", "LS_CANADA"]).optional().nullable(),
  region: z.string().optional().nullable(),
  isActive: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      region: true,
      isActive: true,
      createdAt: true,
      _count: { select: { customers: true, actionItems: true } },
    },
  });

  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const body = await req.json();
  const parsed = userUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { password, email, ...rest } = parsed.data;

  if (email) {
    const conflict = await prisma.user.findFirst({
      where: { email: email.toLowerCase(), NOT: { id } },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }
      );
    }
  }

  const updateData: Record<string, unknown> = { ...rest };
  if (email) updateData.email = email.toLowerCase();
  if (password) updateData.password = await bcrypt.hash(password, 12);

  const user = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      region: true,
      isActive: true,
      createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const currentUserId = session.user?.id;

  if (id === currentUserId) {
    return NextResponse.json(
      { error: "You cannot delete your own account." },
      { status: 400 }
    );
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Unassign from customers and action items (nullable FK — set to null)
      await tx.customer.updateMany({ where: { assignedRepId: id }, data: { assignedRepId: null } });
      await tx.revenueRecord.updateMany({ where: { repId: id }, data: { repId: null } });
      await tx.actionItem.updateMany({ where: { assignedToId: id }, data: { assignedToId: null } });

      // Forecasts require a repId (non-nullable) — delete them along with their items
      const forecasts = await tx.forecast.findMany({ where: { repId: id }, select: { id: true } });
      const forecastIds = forecasts.map((f) => f.id);
      if (forecastIds.length > 0) {
        await tx.forecastItem.deleteMany({ where: { forecastId: { in: forecastIds } } });
        await tx.forecast.deleteMany({ where: { id: { in: forecastIds } } });
      }

      await tx.user.delete({ where: { id } });
    });
  } catch (err) {
    console.error("Failed to delete user:", err);
    return NextResponse.json(
      { error: "Failed to delete user. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
