import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { shouldFilterByDivision } from "@/lib/division";

const schema = z.object({
  customerId: z.string().min(1),
  period: z.string().min(1),
  startDate: z.string(),
  endDate: z.string(),
  notes: z.string().optional().nullable(),
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().positive(),
      unitPrice: z.number().positive(),
      wholesalePercent: z.number().min(0).max(100).default(0),
      retailPercent: z.number().min(0).max(100).default(100),
      lineTotal: z.number(),
      notes: z.string().optional().nullable(),
    })
  ),
});

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id;
  const division = (session.user as { division?: string | null })?.division;

  const forecasts = await prisma.forecast.findMany({
    where: {
      ...(role === "REP" ? { repId: userId } : {}),
      ...(role === "MANAGER" && shouldFilterByDivision(role, division)
        ? { rep: { division } }
        : {}),
      ...(status ? { status: status as "DRAFT" | "SUBMITTED" | "APPROVED" | "REJECTED" } : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      rep: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(forecasts);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...header } = parsed.data;
  const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0);

  const forecast = await prisma.forecast.create({
    data: {
      ...header,
      startDate: new Date(header.startDate),
      endDate: new Date(header.endDate),
      repId: session.user!.id!,
      totalAmount,
      items: { create: items },
    },
    include: {
      customer: { select: { id: true, name: true } },
      rep: { select: { name: true } },
      items: { include: { product: { select: { name: true, sku: true } } } },
    },
  });

  return NextResponse.json(forecast, { status: 201 });
}
