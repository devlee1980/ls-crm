import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const deal = await prisma.pipelineDeal.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, name: true } },
      assignedRep: { select: { id: true, name: true } },
    },
  });

  if (!deal) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(deal);
}

export async function PUT(req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const { title, customerId, assignedRepId, stage, value, probability, expectedClose, notes } = body;

  const deal = await prisma.pipelineDeal.update({
    where: { id },
    data: {
      ...(title !== undefined && { title }),
      ...(customerId !== undefined && { customerId: customerId || null }),
      ...(assignedRepId !== undefined && { assignedRepId: assignedRepId || null }),
      ...(stage !== undefined && { stage }),
      ...(value !== undefined && { value: parseFloat(value) }),
      ...(probability !== undefined && { probability: parseInt(probability) }),
      ...(expectedClose !== undefined && { expectedClose: expectedClose ? new Date(expectedClose) : null }),
      ...(notes !== undefined && { notes: notes || null }),
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignedRep: { select: { id: true, name: true } },
    },
  });

  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.pipelineDeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
