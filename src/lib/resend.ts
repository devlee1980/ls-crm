import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

// Always CC'd on action item assignment notifications
const ASSIGNMENT_CC = ["Lee.McDuffie@lifescientific.com"];

export async function getManagerEmails(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: { in: ["ADMIN", "MANAGER"] },
    },
    select: { email: true },
  });
  return users.map((u) => u.email).filter(Boolean) as string[];
}

export async function getAssigneeEmail(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });
  return user?.email ?? null;
}

export function getAssignmentRecipients(assigneeEmail: string | null): string[] {
  const recipients = new Set<string>(ASSIGNMENT_CC);
  if (assigneeEmail) recipients.add(assigneeEmail);
  return [...recipients];
}

interface SendEmailOptions {
  from: string;
  to: string[];
  subject: string;
  html: string;
}

export async function sendEmail({ from, to, subject, html }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[resend] RESEND_API_KEY not set — skipping email send");
    return;
  }
  if (to.length === 0) {
    console.warn("[resend] No recipients found — skipping email send");
    return;
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({ from, to, subject, html });
  } catch (err) {
    console.error("[resend] Failed to send email:", err);
  }
}
