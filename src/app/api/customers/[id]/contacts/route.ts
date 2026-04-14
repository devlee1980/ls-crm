import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const contactSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  title: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable(),
  isPrimary: z.boolean().default(false),
  decisionMaker: z.boolean().default(false),
  notes: z.string().optional().nullable(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: customerId } = await params;
  const body = await req.json();
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  if (parsed.data.isPrimary) {
    await prisma.contact.updateMany({
      where: { customerId },
      data: { isPrimary: false },
    });
  }

  const contact = await prisma.contact.create({
    data: { ...parsed.data, customerId },
  });

  return NextResponse.json(contact, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const contactId = searchParams.get("contactId");
  if (!contactId) return NextResponse.json({ error: "contactId required" }, { status: 400 });

  await prisma.contact.delete({ where: { id: contactId } });
  return NextResponse.json({ success: true });
}
