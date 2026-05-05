import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const SECURITY_HEADERS: Record<string, string> = {
  "X-Frame-Options": "DENY",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-DNS-Prefetch-Control": "off",
};

// Routes a half-authenticated (MFA-incomplete) user may still reach.
const MFA_BYPASS_PREFIXES = [
  "/mfa",
  "/api/auth",
  "/login",
  "/forgot-password",
  "/reset-password",
];

function isMfaBypassed(pathname: string): boolean {
  return MFA_BYPASS_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
}

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isLoggedIn = !!req.auth;
  const mfaVerified = req.auth?.user?.mfaVerified === true;
  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password");

  let response: NextResponse;

  if (isAuthRoute) {
    if (isLoggedIn && mfaVerified) {
      response = NextResponse.redirect(new URL("/dashboard", req.url));
    } else if (isLoggedIn) {
      // Logged in but still need to enroll/verify MFA.
      response = NextResponse.redirect(new URL("/mfa/enroll", req.url));
    } else {
      response = NextResponse.next();
    }
  } else if (!isLoggedIn) {
    const loginUrl = new URL("/login", req.url);
    // Preserve the intended destination so we can redirect back after login
    loginUrl.searchParams.set("callbackUrl", pathname);
    response = NextResponse.redirect(loginUrl);
  } else if (!mfaVerified && !isMfaBypassed(pathname)) {
    response = NextResponse.redirect(new URL("/mfa/enroll", req.url));
  } else {
    response = NextResponse.next();
  }

  // Apply security headers to every response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|manifest.webmanifest|icon.png|apple-icon.png|\\.well-known).*)",
  ],
};
