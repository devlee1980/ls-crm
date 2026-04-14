import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const metadata = { title: "Analytics | LS Nexus" };

export default async function AnalyticsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;

  if (role !== "ADMIN") redirect("/dashboard");

  return (
    <div className="flex flex-col">
      <Header
        title="Analytics"
        subtitle="Monitor who is accessing LS Nexus and how they use it."
      />
      <main className="flex-1 p-6">
        <AnalyticsDashboard />
      </main>
    </div>
  );
}
