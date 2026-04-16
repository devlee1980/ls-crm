import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getPipelineEmailRecipients } from "@/lib/resend";
import { dealStageUpdatedEmail } from "@/lib/email-templates";
import { getPipelineDealWhere } from "@/lib/division";
import { assertPipelineDealRefsAllowed } from "@/lib/pipeline-deal-access";

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const deal = await prisma.pipelineDeal.findFirst({
    where: { id, ...getPipelineDealWhere(role, userId, division) },
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
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const existingDeal = await prisma.pipelineDeal.findFirst({
    where: { id, ...getPipelineDealWhere(role, userId, division) },
    select: {
      customerId: true,
      assignedRepId: true,
      stage: true,
    },
  });
  if (!existingDeal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json();
  const { title, customerId, assignedRepId, stage, value, probability, expectedClose, notes } = body;

  const nextCustomerId =
    customerId !== undefined ? customerId || null : existingDeal.customerId;
  const nextRepId =
    assignedRepId !== undefined ? assignedRepId || null : existingDeal.assignedRepId;

  const refsOk = await assertPipelineDealRefsAllowed(role, division, nextCustomerId, nextRepId);
  if (!refsOk.ok) {
    return NextResponse.json({ error: refsOk.message }, { status: 400 });
  }

  // Fetch current stage before update to detect changes
  const current =
    stage !== undefined ? { stage: existingDeal.stage } : null;

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
      customer: { select: { id: true, name: true, division: true } },
      assignedRep: { select: { id: true, name: true, division: true } },
    },
  });

  if (current && current.stage !== deal.stage) {
    // Resolve division from the rep first, then from the customer.
    const dealDivision =
      (deal.assignedRep as { division?: string | null } | null)?.division ??
      (deal.customer as { division?: string | null } | null)?.division ??
      null;

    getPipelineEmailRecipients(dealDivision).then((to) => {
      const { subject, html } = dealStageUpdatedEmail(
        {
          ...deal,
          expectedClose: deal.expectedClose ? deal.expectedClose.toISOString() : null,
        },
        current.stage,
        dealDivision
      );
      return sendEmail({ from: "info@ls-nexus.com", to, subject, html });
    }).catch((err) => console.error("[pipeline] stage email error:", err));

    // When a deal transitions to WON, auto-create a revenue record for the customer
    if (deal.stage === "WON" && deal.customerId && deal.value > 0) {
      const now = new Date();
      const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      prisma.revenueRecord.create({
        data: {
          customerId: deal.customerId,
          repId: deal.assignedRepId ?? null,
          period,
          date: now,
          totalAmount: deal.value,
          notes: `Auto-created from won pipeline deal: ${deal.title}`,
        },
      }).catch((err) => console.error("[pipeline] revenue record error:", err));
    }
  }

  return NextResponse.json(deal);
}

export async function DELETE(_req: Request, { params }: Params) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id ?? "";
  const division = (session.user as { division?: string | null })?.division;

  const existing = await prisma.pipelineDeal.findFirst({
    where: { id, ...getPipelineDealWhere(role, userId, division) },
    select: { id: true },
  });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.pipelineDeal.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
