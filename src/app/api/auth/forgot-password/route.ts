import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/resend";
import { passwordResetEmail } from "@/lib/email-templates";
import crypto from "crypto";

const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: Request) {
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();

  // Always return success to prevent email enumeration
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true, email: true, isActive: true },
  });

  if (user && user.isActive) {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + TOKEN_EXPIRY_MS);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: token,
        passwordResetExpires: expires,
      },
    });

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://ls-nexus.com";
    const resetUrl = `${appUrl}/reset-password?token=${token}`;
    const { subject, html } = passwordResetEmail(resetUrl);

    await sendEmail({
      from: "noreply@ls-nexus.com",
      to: [user.email],
      subject,
      html,
    });
  }

  return NextResponse.json({ success: true });
}
