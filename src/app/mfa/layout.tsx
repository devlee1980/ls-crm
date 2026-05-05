import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SessionProvider } from "@/components/layout/SessionProvider";

export default async function MfaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return <SessionProvider session={session}>{children}</SessionProvider>;
}
