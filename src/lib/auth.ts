import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { normalizeBackupCode, verifyTotp } from "@/lib/mfa";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

// All email domains are allowed by policy — access is gated by user provisioning, not domain.
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  totp: z
    .string()
    .regex(/^\d{6}$/)
    .optional(),
  backupCode: z.string().min(8).max(32).optional(),
});

class InvalidCredentialsError extends CredentialsSignin {
  code = "invalid_credentials";
}

class AccountLockedError extends CredentialsSignin {
  code = "account_locked";
}

class AccountDisabledError extends CredentialsSignin {
  code = "account_disabled";
}

class MfaRequiredError extends CredentialsSignin {
  code = "mfa_required";
}

class MfaInvalidError extends CredentialsSignin {
  code = "mfa_invalid";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE,
    updateAge: 60 * 60, // refresh session token every hour
  },
  cookies: {
    sessionToken: {
      options: {
        httpOnly: true,
        sameSite: "strict",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials);
        if (!parsed.success) throw new InvalidCredentialsError();

        // Normalize email to prevent case-sensitivity bypass
        const email = parsed.data.email.toLowerCase().trim();

        const user = await prisma.user.findUnique({
          where: { email },
          select: {
            id: true,
            name: true,
            email: true,
            password: true,
            role: true,
            division: true,
            avatarUrl: true,
            isActive: true,
            loginAttempts: true,
            lockedUntil: true,
            sessionTimeoutMinutes: true,
            mfaEnabled: true,
            mfaSecret: true,
          },
        });

        // Use a generic error for unknown emails to prevent enumeration
        if (!user) throw new InvalidCredentialsError();

        if (!user.isActive) throw new AccountDisabledError();

        if (user.lockedUntil && user.lockedUntil > new Date()) {
          throw new AccountLockedError();
        }

        const valid = await bcrypt.compare(parsed.data.password, user.password);

        if (!valid) {
          await registerFailedAttempt(user.id, user.loginAttempts);
          throw new InvalidCredentialsError();
        }

        // Password is valid — now enforce MFA when enrolled.
        let mfaVerified = false;
        if (user.mfaEnabled) {
          const { totp, backupCode } = parsed.data;

          if (!totp && !backupCode) {
            // Don't reset login attempts yet — they still need to complete MFA.
            throw new MfaRequiredError();
          }

          let mfaOk = false;

          if (totp && user.mfaSecret) {
            mfaOk = verifyTotp(user.mfaSecret, totp);
          }

          if (!mfaOk && backupCode) {
            mfaOk = await consumeBackupCode(user.id, backupCode);
          }

          if (!mfaOk) {
            await registerFailedAttempt(user.id, user.loginAttempts);
            throw new MfaInvalidError();
          }

          mfaVerified = true;
        }

        // Successful login — reset attempt counter and any expired lock
        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: 0,
            lockedUntil: null,
          },
        });

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          division: user.division,
          image: user.avatarUrl,
          sessionTimeoutMinutes: user.sessionTimeoutMinutes,
          mfaEnabled: user.mfaEnabled,
          mfaVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.division = (user as { division?: string }).division;
        token.sessionTimeoutMinutes =
          (user as { sessionTimeoutMinutes?: number }).sessionTimeoutMinutes ?? 480;
        token.mfaEnabled = (user as { mfaEnabled?: boolean }).mfaEnabled ?? false;
        token.mfaVerified = (user as { mfaVerified?: boolean }).mfaVerified ?? false;
      }

      // Allow the enrollment flow to flip mfaEnabled/mfaVerified to true after the
      // user completes MFA setup. Triggered via `update()` from the client.
      if (trigger === "update" && session?.mfa) {
        const next = session.mfa as { mfaEnabled?: boolean; mfaVerified?: boolean };
        if (typeof next.mfaEnabled === "boolean") token.mfaEnabled = next.mfaEnabled;
        if (typeof next.mfaVerified === "boolean") token.mfaVerified = next.mfaVerified;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.division = token.division as string | undefined;
        session.user.sessionTimeoutMinutes =
          (token.sessionTimeoutMinutes as number | undefined) ?? 480;
        session.user.mfaEnabled = Boolean(token.mfaEnabled);
        session.user.mfaVerified = Boolean(token.mfaVerified);
      }
      return session;
    },
  },
});

async function registerFailedAttempt(userId: string, currentAttempts: number) {
  const newAttempts = currentAttempts + 1;
  const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;
  await prisma.user.update({
    where: { id: userId },
    data: {
      loginAttempts: newAttempts,
      lockedUntil: shouldLock
        ? new Date(Date.now() + LOCKOUT_DURATION_MS)
        : undefined,
    },
  });
  if (shouldLock) throw new AccountLockedError();
}

async function consumeBackupCode(userId: string, raw: string): Promise<boolean> {
  const normalized = normalizeBackupCode(raw);
  if (normalized.length < 6) return false;

  const codes = await prisma.mfaBackupCode.findMany({
    where: { userId, usedAt: null },
    select: { id: true, codeHash: true },
  });

  for (const code of codes) {
    if (await bcrypt.compare(normalized, code.codeHash)) {
      await prisma.mfaBackupCode.update({
        where: { id: code.id },
        data: { usedAt: new Date() },
      });
      return true;
    }
  }
  return false;
}
