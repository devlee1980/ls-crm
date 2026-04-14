import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getForecastAccessWhere } from "@/lib/division";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "SUBMITTED", "APPROVED", "REJECTED"]).optional(),
  notes: z.string().optional().nullable(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const forecast = await prisma.forecast.findFirst({
    where: { id, ...getForecastAccessWhere(role, userId, division) },
    include: {
      customer: { select: { id: true, name: true } },
      rep: { select: { name: true } },
      items: {
        include: { product: { select: { id: true, name: true, sku: true, uom: true } } },
      },
    },
  });

  if (!forecast) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(forecast);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const existing = await prisma.forecast.findFirst({
    where: { id, ...getForecastAccessWhere(role, userId, division) },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const forecast = await prisma.forecast.update({ where: { id }, data: parsed.data });
  return NextResponse.json(forecast);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const existing = await prisma.forecast.findFirst({
    where: { id, ...getForecastAccessWhere(role, userId, division) },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.forecast.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
