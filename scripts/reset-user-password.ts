/**
 * Reset a user's password (and clear lockout + MFA state so they can re-enroll).
 *
 * Usage:
 *   tsx scripts/reset-user-password.ts <email> <newPassword>
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const [, , email, password] = process.argv;
  if (!email || !password) {
    console.error("Usage: tsx scripts/reset-user-password.ts <email> <newPassword>");
    process.exit(1);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const hashed = await bcrypt.hash(password, 12);

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true, name: true },
  });

  if (!user) {
    console.error(`No user found with email ${normalizedEmail}`);
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashed,
        loginAttempts: 0,
        lockedUntil: null,
        passwordResetToken: null,
        passwordResetExpires: null,
        mfaEnabled: false,
        mfaSecret: null,
        mfaEnrolledAt: null,
      },
    }),
    prisma.mfaBackupCode.deleteMany({ where: { userId: user.id } }),
  ]);

  console.log(`Password reset for ${user.name} (${normalizedEmail}).`);
  console.log("Lockout cleared. MFA cleared — user will re-enroll on next sign-in.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
