import { NextResponse } from "next/server";
import { signOut } from "@/lib/auth";

/**
 * Internal helper used when the JWT and DB get out of sync (e.g. user is
 * already MFA-enrolled in the DB but the current session token says
 * mfaVerified=false). Signs the user out so they can complete a fresh
 * email + password + TOTP flow.
 */
export async function GET(req: Request) {
  await signOut({ redirect: false });
  const url = new URL("/login?mfa=required", req.url);
  return NextResponse.redirect(url);
}
