import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ForecastList } from "@/components/forecast/ForecastList";

export default async function ForecastPage() {
  const session = await auth();
  const role = (session!.user as { role?: string })?.role ?? "REP";
  const userId = session!.user!.id!;

  const forecasts = await prisma.forecast.findMany({
    where: role === "REP" ? { repId: userId } : {},
    include: {
      customer: { select: { id: true, name: true } },
      rep: { select: { name: true } },
      _count: { select: { items: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const customers = await prisma.customer.findMany({
    where: role === "REP" ? { assignedRepId: userId } : {},
    select: { id: true, name: true, wholesalePercent: true, retailPercent: true },
    orderBy: { name: "asc" },
  });

  const products = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, name: true, sku: true, unitPrice: true, uom: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col">
      <Header
        title="Financial Forecasting"
        subtitle="Build and manage sales forecasts by customer and product"
      />
      <main className="flex-1 p-6">
        <ForecastList
          initialForecasts={forecasts}
          customers={customers}
          products={products}
        />
      </main>
    </div>
  );
}
