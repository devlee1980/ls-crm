import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SessionProvider } from "@/components/layout/SessionProvider";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <div className="flex h-screen bg-muted/30">
        <Sidebar />
        <div className="flex-1 flex flex-col ml-64 min-h-screen overflow-auto">
          {children}
        </div>
      </div>
    </SessionProvider>
  );
}
