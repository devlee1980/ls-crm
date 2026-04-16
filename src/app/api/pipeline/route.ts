import { NextResponse } from "next/server";
import type { PipelineStage, Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPipelineEmailRecipients } from "@/lib/resend";
import { dealCreatedEmail } from "@/lib/email-templates";
import { getPipelineDealWhere } from "@/lib/division";
import { assertPipelineDealRefsAllowed } from "@/lib/pipeline-deal-access";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const repId = searchParams.get("repId");

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const access = getPipelineDealWhere(role, userId, division);
  const where: Prisma.PipelineDealWhereInput = {
    ...access,
    ...(stage ? { stage: stage as PipelineStage } : {}),
    ...(repId ? { assignedRepId: repId } : {}),
  };

  const deals = await prisma.pipelineDeal.findMany({
    where,
    include: {
      customer: { select: { id: true, name: true } },
      assignedRep: { select: { id: true, name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(deals);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, customerId, assignedRepId, stage, value, probability, expectedClose, notes } = body;

  if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

  const role = (session.user as { role?: string })?.role ?? "REP";
  const division = (session.user as { division?: string | null })?.division;

  const refsOk = await assertPipelineDealRefsAllowed(
    role,
    division,
    customerId || null,
    assignedRepId || null
  );
  if (!refsOk.ok) {
    return NextResponse.json({ error: refsOk.message }, { status: 400 });
  }

  const deal = await prisma.pipelineDeal.create({
    data: {
      title,
      customerId: customerId || null,
      assignedRepId: assignedRepId || null,
      stage: stage || "LEAD",
      value: parseFloat(value) || 0,
      probability: parseInt(probability) || 10,
      expectedClose: expectedClose ? new Date(expectedClose) : null,
      notes: notes || null,
    },
    include: {
      customer: { select: { id: true, name: true, division: true } },
      assignedRep: { select: { id: true, name: true, division: true } },
    },
  });

  // Resolve division from the rep first, then from the customer, for targeted notifications.
  const dealDivision =
    (deal.assignedRep as { division?: string | null } | null)?.division ??
    (deal.customer as { division?: string | null } | null)?.division ??
    null;

  // Fire-and-forget — don't block the response
  getPipelineEmailRecipients(dealDivision).then((to) => {
    const { subject, html } = dealCreatedEmail({
      ...deal,
      expectedClose: deal.expectedClose ? deal.expectedClose.toISOString() : null,
    }, dealDivision);
    return sendEmail({ from: "info@ls-nexus.com", to, subject, html });
  }).catch((err) => console.error("[pipeline] email error:", err));

  return NextResponse.json(deal, { status: 201 });
}
