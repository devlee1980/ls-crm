import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { SessionProvider } from "@/components/layout/SessionProvider";

export default async function MfaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  // Authoritative MFA state lives in the DB; the JWT can be stale (e.g. after
  // an admin reset, or right after enrollment before the cookie re-signs).
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mfaEnabled: true },
  });
  if (!user) redirect("/login");

  const mfaVerified = session.user.mfaVerified === true;

  // Already verified for this session — done.
  if (mfaVerified) redirect("/dashboard");

  // Already enrolled in the DB but this session hasn't completed the second
  // factor. Force sign-out via the dedicated route handler (Server Components
  // can't modify cookies directly), then send them through fresh sign-in.
  if (user.mfaEnabled) redirect("/api/auth/mfa/force-signout");

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
