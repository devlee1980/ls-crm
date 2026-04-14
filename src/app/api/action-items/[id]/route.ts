import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { sendEmail, getAssigneeEmail, getAssignmentRecipients } from "@/lib/resend";
import { actionItemAssignedEmail } from "@/lib/email-templates";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.string().optional().nullable(),
  assignedToId: z.string().optional().nullable(),
  customerId: z.string().optional().nullable(),
});

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { dueDate, ...rest } = parsed.data;

  // Capture old assignee before update to detect re-assignment
  const before = await prisma.actionItem.findUnique({
    where: { id },
    select: { assignedToId: true },
  });

  const completedAt =
    rest.status === "DONE" ? new Date() : rest.status ? null : undefined;

  const item = await prisma.actionItem.update({
    where: { id },
    data: {
      ...rest,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      ...(completedAt !== undefined ? { completedAt } : {}),
    },
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
  });

  // If assignee changed, notify the new assignee + Lee.McDuffie@lifescientific.com
  const assigneeChanged =
    rest.assignedToId !== undefined && rest.assignedToId !== before?.assignedToId;

  if (assigneeChanged && item.assignedToId) {
    const itemData = {
      ...item,
      dueDate: item.dueDate ? item.dueDate.toISOString() : null,
    };
    getAssigneeEmail(item.assignedToId).then((assigneeEmail) => {
      const to = getAssignmentRecipients(assigneeEmail);
      const assigneeName = item.assignedTo?.name ?? "Team";
      const { subject, html } = actionItemAssignedEmail(itemData, assigneeName);
      return sendEmail({ from: "action@ls-nexus.com", to, subject, html });
    }).catch((err) => console.error("[action-items] re-assign email error:", err));
  }

  return NextResponse.json(item);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await prisma.actionItem.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
