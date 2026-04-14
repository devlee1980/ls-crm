import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getManagerEmails } from "@/lib/resend";
import { dealStageUpdatedEmail } from "@/lib/email-templates";

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

  // Fetch current stage before update to detect changes
  const current = stage !== undefined
    ? await prisma.pipelineDeal.findUnique({ where: { id }, select: { stage: true } })
    : null;

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

  if (current && current.stage !== deal.stage) {
    getManagerEmails().then((to) => {
      const { subject, html } = dealStageUpdatedEmail(
        {
          ...deal,
          expectedClose: deal.expectedClose ? deal.expectedClose.toISOString() : null,
        },
        current.stage
      );
      return sendEmail({ from: "info@ls-nexus.com", to, subject, html });
    }).catch((err) => console.error("[pipeline] stage email error:", err));
  }

  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.pipelineDeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
