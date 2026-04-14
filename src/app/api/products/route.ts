import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const productSchema = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  unitPrice: z.number().positive(),
  uom: z.string().default("Each"),
  pricePerGallon: z.number().nonnegative().optional().nullable(),
  gallonsPerCase: z.number().nonnegative().optional().nullable(),
  litersPerCase: z.number().nonnegative().optional().nullable(),
  market: z.enum(["US", "Canada", "Both"]).default("US"),
  isActive: z.boolean().default(true),
});

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const products = await prisma.product.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { forecastItems: true } } },
  });

  return NextResponse.json(products);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await prisma.product.create({ data: parsed.data });
  return NextResponse.json(product, { status: 201 });
}
