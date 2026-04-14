import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail, getManagerEmails } from "@/lib/resend";
import { actionItemsDigestEmail } from "@/lib/email-templates";

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await prisma.actionItem.findMany({
    where: {
      status: { in: ["TODO", "IN_PROGRESS"] },
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const serialized = items.map((item) => ({
    ...item,
    dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    completedAt: item.completedAt ? item.completedAt.toISOString() : null,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));

  const to = await getManagerEmails();
  const { subject, html } = actionItemsDigestEmail(serialized);
  await sendEmail({ from: "action@ls-nexus.com", to, subject, html });

  return NextResponse.json({ sent: true, count: items.length });
}
