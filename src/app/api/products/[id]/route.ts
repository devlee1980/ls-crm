import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductMarketWhere } from "@/lib/division";
import { z } from "zod";

function sessionProductWhere(session: Session) {
  const role = (session.user as { role?: string })?.role ?? "REP";
  const division = (session.user as { division?: string | null })?.division;
  return getProductMarketWhere(role, division);
}

const productSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive().optional(),
  uom: z.string().optional(),
  pricePerGallon: z.number().nonnegative().optional().nullable(),
  gallonsPerCase: z.number().nonnegative().optional().nullable(),
  litersPerCase: z.number().nonnegative().optional().nullable(),
  market: z.enum(["US", "Canada", "Both"]).optional(),
  isActive: z.boolean().optional(),
});

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const marketWhere = sessionProductWhere(session);

  const product = await prisma.product.findFirst({ where: { id, ...marketWhere } });
  if (!product) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(product);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const marketWhere = sessionProductWhere(session);

  const existing = await prisma.product.findFirst({ where: { id, ...marketWhere } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.update({ where: { id }, data: parsed.data });
  return NextResponse.json(product);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const marketWhere = sessionProductWhere(session);

  const existing = await prisma.product.findFirst({ where: { id, ...marketWhere } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
