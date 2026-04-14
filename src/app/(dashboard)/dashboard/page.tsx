import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEntityFilter } from "@/lib/entity";
import { Header } from "@/components/layout/Header";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopCustomers } from "@/components/dashboard/TopCustomers";
import { UpcomingActions } from "@/components/dashboard/UpcomingActions";
import type { Session } from "next-auth";

async function getDashboardData(userId: string, role: string, session: Session) {
  const entityFilter = getEntityFilter(session);
  const repFilter = role === "REP" ? { assignedRepId: userId } : {};
  const repRevenueFilter = role === "REP" ? { repId: userId } : {};
  const repForecastFilter = role === "REP" ? { repId: userId } : {};
  const repActionFilter = role === "REP" ? { assignedToId: userId } : {};

  const customerWhere = { ...entityFilter, ...repFilter };

  const [
    customerCount,
    openForecastCount,
    totalRevenueAgg,
    openActionCount,
    topCustomers,
    recentActions,
    monthlyRevenue,
  ] = await Promise.all([
    prisma.customer.count({ where: customerWhere }),
    prisma.forecast.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED"] },
        ...entityFilter,
        ...repForecastFilter,
      },
    }),
    prisma.revenueRecord.aggregate({
      _sum: { totalAmount: true },
      where: { ...entityFilter, ...repRevenueFilter },
    }),
    prisma.actionItem.count({
      where: { status: { not: "DONE" }, ...entityFilter, ...repActionFilter },
    }),
    prisma.customer.findMany({
      where: customerWhere,
      include: {
        revenueRecords: { select: { totalAmount: true } },
      },
      take: 8,
      orderBy: { createdAt: "desc" },
    }),
    prisma.actionItem.findMany({
      where: {
        status: { not: "DONE" },
        dueDate: { not: null },
        ...entityFilter,
        ...repActionFilter,
      },
      include: { customer: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.revenueRecord.groupBy({
      by: ["period"],
      _sum: { totalAmount: true },
      where: { ...entityFilter, ...repRevenueFilter },
      orderBy: { period: "asc" },
      take: 8,
    }),
  ]);

  const topCustomersWithRevenue = topCustomers
    .map((c) => ({
      id: c.id,
      name: c.name,
      rating: c.rating,
      status: c.status,
      totalRevenue: c.revenueRecords.reduce((s, r) => s + r.totalAmount, 0),
    }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
    .slice(0, 5);

  return {
    kpis: {
      customerCount,
      openForecastCount,
      totalRevenue: totalRevenueAgg._sum.totalAmount ?? 0,
      openActionCount,
    },
    topCustomers: topCustomersWithRevenue,
    recentActions,
    monthlyRevenue: monthlyRevenue.map((r) => ({
      period: r.period,
      revenue: r._sum.totalAmount ?? 0,
    })),
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string })?.role ?? "REP";

  const data = await getDashboardData(userId, role, session!);

  return (
    <div className="flex flex-col">
      <Header
        title={`Welcome back, ${session!.user!.name?.split(" ")[0]}`}
        subtitle="Here's what's happening with your accounts today."
      />
      <main className="flex-1 p-6 space-y-6">
        <DashboardKPIs kpis={data.kpis} />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RevenueChart data={data.monthlyRevenue} />
          </div>
          <TopCustomers customers={data.topCustomers} />
        </div>
        <UpcomingActions actions={data.recentActions} />
      </main>
    </div>
  );
}
