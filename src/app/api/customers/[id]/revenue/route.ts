import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const revenueSchema = z.object({
  period: z.string().min(1),
  date: z.string(),
  totalAmount: z.number().positive(),
  notes: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        productId: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        lineTotal: z.number(),
      })
    )
    .optional(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;
  const body = await req.json();
  const parsed = revenueSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { items, ...recordData } = parsed.data;

  const record = await prisma.revenueRecord.create({
    data: {
      ...recordData,
      date: new Date(recordData.date),
      customerId,
      repId: session.user?.id,
      items: items
        ? {
            create: items,
          }
        : undefined,
    },
    include: { items: { include: { product: { select: { name: true } } } } },
  });

  return NextResponse.json(record, { status: 201 });
}
