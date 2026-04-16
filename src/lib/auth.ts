import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes
const SESSION_MAX_AGE = 8 * 60 * 60; // 8 hours in seconds

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
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
          const newAttempts = user.loginAttempts + 1;
          const shouldLock = newAttempts >= MAX_LOGIN_ATTEMPTS;

          await prisma.user.update({
            where: { id: user.id },
            data: {
              loginAttempts: newAttempts,
              lockedUntil: shouldLock
                ? new Date(Date.now() + LOCKOUT_DURATION_MS)
                : undefined,
            },
          });

          if (shouldLock) throw new AccountLockedError();
          throw new InvalidCredentialsError();
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
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
        token.division = (user as { division?: string }).division;
        token.sessionTimeoutMinutes = (user as { sessionTimeoutMinutes?: number }).sessionTimeoutMinutes ?? 480;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.division = token.division as string | undefined;
        session.user.sessionTimeoutMinutes = (token.sessionTimeoutMinutes as number | undefined) ?? 480;
      }
      return session;
    },
  },
});
