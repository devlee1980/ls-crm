import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateSecret, MFA_CONFIG } from "@/lib/mfa";
import crypto from "crypto";

export const MFA_SETUP_COOKIE = "mfa_setup";
const COOKIE_MAX_AGE_SECONDS = 15 * 60; // 15 minutes

function getSigningKey(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return secret;
}

export function signSetupPayload(payload: { secret: string; userId: string; expiresAt: number }) {
  const json = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", getSigningKey())
    .update(json)
    .digest("base64url");
  return `${json}.${sig}`;
}

export function verifySetupPayload(
  raw: string | undefined,
  userId: string
): { secret: string } | null {
  if (!raw) return null;
  const [json, sig] = raw.split(".");
  if (!json || !sig) return null;
  const expected = crypto
    .createHmac("sha256", getSigningKey())
    .update(json)
    .digest("base64url");
  if (
    expected.length !== sig.length ||
    !crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig))
  ) {
    return null;
  }
  let parsed: { secret: string; userId: string; expiresAt: number };
  try {
    parsed = JSON.parse(Buffer.from(json, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (parsed.userId !== userId) return null;
  if (parsed.expiresAt < Date.now()) return null;
  return { secret: parsed.secret };
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { base32, otpauthUrl } = generateSecret(session.user.email);

  const payload = signSetupPayload({
    secret: base32,
    userId: session.user.id,
    expiresAt: Date.now() + COOKIE_MAX_AGE_SECONDS * 1000,
  });

  const res = NextResponse.json({
    otpauthUrl,
    secret: base32,
    issuer: MFA_CONFIG.issuer,
    digits: MFA_CONFIG.totp.digits,
    period: MFA_CONFIG.totp.period,
  });

  res.cookies.set(MFA_SETUP_COOKIE, payload, {
    httpOnly: true,
    sameSite: "strict",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });

  return res;
}
