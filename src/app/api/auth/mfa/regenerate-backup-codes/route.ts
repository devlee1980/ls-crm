import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateBackupCodes } from "@/lib/mfa";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!session.user.mfaEnabled || !session.user.mfaVerified) {
    return NextResponse.json(
      { error: "MFA must be enrolled and verified to regenerate backup codes." },
      { status: 403 }
    );
  }

  const { plain, hashed } = generateBackupCodes();

  await prisma.$transaction([
    prisma.mfaBackupCode.deleteMany({ where: { userId: session.user.id } }),
    prisma.mfaBackupCode.createMany({
      data: hashed.map((codeHash) => ({ userId: session.user!.id, codeHash })),
    }),
  ]);

  return NextResponse.json({ backupCodes: plain });
}
