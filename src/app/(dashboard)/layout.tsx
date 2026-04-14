import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { SessionProvider } from "@/components/layout/SessionProvider";
import { SidebarProvider } from "@/components/layout/SidebarContext";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <SessionProvider session={session}>
      <SidebarProvider>
        <PageViewTracker />
        <div className="flex h-screen bg-muted/30">
          <Sidebar />
          <div className="flex-1 flex flex-col lg:ml-64 min-h-screen overflow-auto">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
