import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name: z.string().min(1).optional(),
  accountNumber: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  type: z.enum(["DISTRIBUTOR", "RETAILER", "DIRECT", "OTHER"]).optional(),
  wholesalePercent: z.number().min(0).max(100).optional(),
  retailPercent: z.number().min(0).max(100).optional(),
  rating: z.number().min(0).max(5).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "PROSPECT"]).optional(),
  notes: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  assignedRepId: z.string().optional().nullable(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedRep: { select: { id: true, name: true } },
      locations: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      contacts: { orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] },
      actionItems: {
        include: { assignedTo: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      forecasts: {
        include: { rep: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      revenueRecords: {
        include: { items: { include: { product: { select: { name: true } } } } },
        orderBy: { date: "desc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(customer);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const customer = await prisma.customer.update({ where: { id }, data: parsed.data });
  return NextResponse.json(customer);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.customer.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
