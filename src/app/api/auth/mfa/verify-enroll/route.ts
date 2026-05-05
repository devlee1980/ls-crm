import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import {
  encryptSecret,
  generateBackupCodes,
  verifyTotpFromBase32,
} from "@/lib/mfa";
import { MFA_SETUP_COOKIE, verifySetupPayload } from "../setup/route";

const schema = z.object({
  code: z.string().regex(/^\d{6}$/),
});

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    const cookie = req.headers.get("cookie") ?? "";
    const match = cookie.match(new RegExp(`(?:^|; )${MFA_SETUP_COOKIE}=([^;]+)`));
    const setupValue = match ? decodeURIComponent(match[1]) : undefined;

    const setup = verifySetupPayload(setupValue, session.user.id);
    if (!setup) {
      return NextResponse.json(
        { error: "Setup session expired. Please start enrollment again." },
        { status: 400 }
      );
    }

    if (!verifyTotpFromBase32(setup.secret, parsed.data.code)) {
      return NextResponse.json(
        { error: "That code didn't match. Please try again." },
        { status: 400 }
      );
    }

    // Reject re-enrollment if the user is already enrolled — they should use
    // the regenerate-backup-codes endpoint instead.
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { mfaEnabled: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.mfaEnabled) {
      return NextResponse.json(
        { error: "MFA is already enrolled for this account." },
        { status: 409 }
      );
    }

    const encryptedSecret = encryptSecret(setup.secret);
    const { plain, hashed } = generateBackupCodes();

    await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: {
          mfaSecret: encryptedSecret,
          mfaEnabled: true,
          mfaEnrolledAt: new Date(),
        },
      }),
      prisma.mfaBackupCode.deleteMany({ where: { userId: session.user.id } }),
      prisma.mfaBackupCode.createMany({
        data: hashed.map((codeHash) => ({ userId: session.user!.id, codeHash })),
      }),
    ]);

    const res = NextResponse.json({ backupCodes: plain });
    // Clear the pending-setup cookie now that enrollment is finalized.
    res.cookies.set(MFA_SETUP_COOKIE, "", {
      httpOnly: true,
      sameSite: "strict",
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 0,
    });
    return res;
  } catch (err) {
    console.error("[mfa/verify-enroll] Unexpected error:", err);
    const message =
      err instanceof Error && /MFA_SECRET_KEY/.test(err.message)
        ? "Server is missing MFA_SECRET_KEY. See README — Authentication & MFA."
        : "Could not finalize MFA enrollment. Please try again.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
