import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, getManagerEmails } from "@/lib/resend";
import { dealCreatedEmail } from "@/lib/email-templates";
import { shouldFilterByDivision } from "@/lib/division";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const stage = searchParams.get("stage");
  const repId = searchParams.get("repId");

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user?.id;
  const division = (session.user as { division?: string | null })?.division;

  const where: Record<string, unknown> = {};
  if (stage) where.stage = stage;
  if (repId) where.assignedRepId = repId;
  if (role === "REP") where.assignedRepId = userId;
  // MANAGER: scope to their division via the assigned rep
  if (role === "MANAGER" && shouldFilterByDivision(role, division)) {
    where.assignedRep = { division };
  }

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
      customer: { select: { id: true, name: true } },
      assignedRep: { select: { id: true, name: true } },
    },
  });

  // Fire-and-forget — don't block the response
  getManagerEmails().then((to) => {
    const { subject, html } = dealCreatedEmail({
      ...deal,
      expectedClose: deal.expectedClose ? deal.expectedClose.toISOString() : null,
    });
    return sendEmail({ from: "info@ls-nexus.com", to, subject, html });
  }).catch((err) => console.error("[pipeline] email error:", err));

  return NextResponse.json(deal, { status: 201 });
}
