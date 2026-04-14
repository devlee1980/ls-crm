import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { DashboardKPIs } from "@/components/dashboard/DashboardKPIs";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { TopCustomers } from "@/components/dashboard/TopCustomers";
import { UpcomingActions } from "@/components/dashboard/UpcomingActions";
import { PipelineSummary } from "@/components/dashboard/PipelineSummary";
import {
  getDivisionFilter,
  getForecastAccessWhere,
  getPipelineDealWhere,
  shouldFilterByDivision,
} from "@/lib/division";

const STAGE_ORDER = ["LEAD", "QUALIFIED", "PROPOSAL", "NEGOTIATION", "WON", "LOST"] as const;

async function getDashboardData(userId: string, role: string, division?: string | null) {
  const repFilter = role === "REP" ? { assignedRepId: userId } : {};
  const repRevenueFilter = role === "REP" ? { repId: userId } : {};
  const repActionFilter = role === "REP" ? { assignedToId: userId } : {};

  const divFilter = getDivisionFilter(role, division);
  const managerRepDivFilter =
    role === "MANAGER" && shouldFilterByDivision(role, division)
      ? { rep: { division } }
      : {};
  const managerActionDivFilter =
    role === "MANAGER" && shouldFilterByDivision(role, division)
      ? {
          OR: [
            { customer: { division } },
            { customerId: null, assignedTo: { division } },
          ],
        }
      : {};

  const customerWhere = { ...divFilter, ...repFilter };

  const [
    customerCount,
    openForecastCount,
    totalRevenueAgg,
    openActionCount,
    topCustomers,
    recentActions,
    monthlyRevenue,
    pipelineDeals,
  ] = await Promise.all([
    prisma.customer.count({ where: customerWhere }),
    prisma.forecast.count({
      where: {
        status: { in: ["DRAFT", "SUBMITTED"] },
        ...getForecastAccessWhere(role, userId, division),
      },
    }),
    prisma.revenueRecord.aggregate({
      _sum: { totalAmount: true },
      where: { ...repRevenueFilter, ...managerRepDivFilter },
    }),
    prisma.actionItem.count({
      where: { status: { not: "DONE" }, ...repActionFilter, ...managerActionDivFilter },
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
        ...repActionFilter,
        ...managerActionDivFilter,
      },
      include: { customer: { select: { name: true } } },
      orderBy: { dueDate: "asc" },
      take: 5,
    }),
    prisma.revenueRecord.groupBy({
      by: ["period"],
      _sum: { totalAmount: true },
      where: { ...repRevenueFilter, ...managerRepDivFilter },
      orderBy: { period: "asc" },
      take: 8,
    }),
    prisma.pipelineDeal.findMany({
      where: getPipelineDealWhere(role, userId, division),
      select: { stage: true, value: true, probability: true },
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

  const pipelineByStage = STAGE_ORDER.map((stage) => {
    const stageDeals = pipelineDeals.filter((d) => d.stage === stage);
    return {
      stage,
      label: stage,
      count: stageDeals.length,
      value: stageDeals.reduce((s, d) => s + d.value, 0),
      color: "",
      badgeClass: "",
    };
  });

  const openPipelineDeals = pipelineDeals.filter(
    (d) => d.stage !== "WON" && d.stage !== "LOST"
  );
  const pipelineTotalValue = openPipelineDeals.reduce((s, d) => s + d.value, 0);
  const pipelineWeightedValue = openPipelineDeals.reduce(
    (s, d) => s + d.value * (d.probability / 100),
    0
  );

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
    pipeline: {
      stages: pipelineByStage,
      totalValue: pipelineTotalValue,
      weightedValue: pipelineWeightedValue,
      openDeals: openPipelineDeals.length,
    },
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string })?.role ?? "REP";
  const division = (session!.user as { division?: string | null })?.division;

  const data = await getDashboardData(userId, role, division);

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
          <PipelineSummary
            stages={data.pipeline.stages}
            totalValue={data.pipeline.totalValue}
            weightedValue={data.pipeline.weightedValue}
            openDeals={data.pipeline.openDeals}
          />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <UpcomingActions actions={data.recentActions} />
          </div>
          <TopCustomers customers={data.topCustomers} />
        </div>
      </main>
    </div>
  );
}
