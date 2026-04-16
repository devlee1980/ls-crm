import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ForecastList } from "@/components/forecast/ForecastList";
import { getForecastAccessWhere } from "@/lib/division";

export default async function ForecastPage() {
  const session = await auth();
  const role = (session!.user as { role?: string })?.role ?? "REP";
  const userId = session!.user!.id!;
  const division = (session!.user as { division?: string | null })?.division;

  const forecasts = await prisma.forecast.findMany({
    where: getForecastAccessWhere(role, userId, division),
    include: {
      customer: { select: { id: true, name: true } },
      rep: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex flex-col">
      <Header
        title="Financial Forecasting"
        subtitle="Build and manage sales forecasts by customer and product"
      />
      <main className="flex-1 p-6">
        <ForecastList initialForecasts={forecasts} division={division} />
      </main>
    </div>
  );
}
