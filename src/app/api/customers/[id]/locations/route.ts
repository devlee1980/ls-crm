import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const locationSchema = z.object({
  label: z.string().default("Main"),
  address1: z.string().min(1),
  address2: z.string().optional().nullable(),
  city: z.string().min(1),
  state: z.string().min(1),
  zip: z.string().min(1),
  country: z.string().default("US"),
  phone: z.string().optional().nullable(),
  isPrimary: z.boolean().default(false),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;
  const body = await req.json();
  const parsed = locationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isPrimary) {
    await prisma.customerLocation.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }

  const location = await prisma.customerLocation.create({
    data: { ...parsed.data, customerId },
  });

  return NextResponse.json(location, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const locationId = searchParams.get("locationId");
  if (!locationId) return NextResponse.json({ error: "locationId required" }, { status: 400 });

  await prisma.customerLocation.delete({ where: { id: locationId } });
  return NextResponse.json({ success: true });
}
