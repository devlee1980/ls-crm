import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDivisionFilter, shouldFilterByDivision } from "@/lib/division";
import { ForecastBuilderPage } from "@/components/forecast/ForecastBuilderPage";

export const metadata = { title: "New Forecast — LS Nexus" };

export default async function ForecastNewPage() {
  const session = await auth();
  if (!session) redirect("/login");

  const role = (session.user as { role?: string })?.role ?? "REP";
  const userId = session.user!.id!;
  const division = (session.user as { division?: string | null })?.division;

  const [customers, products] = await Promise.all([
    prisma.customer.findMany({
      where: {
        ...getDivisionFilter(role, division),
        ...(role === "REP" ? { assignedRepId: userId } : {}),
      },
      select: { id: true, name: true, wholesalePercent: true, retailPercent: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        sku: true,
        unitPrice: true,
        uom: true,
        pricePerGallon: true,
        gallonsPerCase: true,
        litersPerCase: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <ForecastBuilderPage customers={customers} products={products} division={division ?? null} />
  );
}
