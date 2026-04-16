import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getProductMarketWhere } from "@/lib/division";
import { Header } from "@/components/layout/Header";
import { ProductsTable } from "@/components/products/ProductsTable";

export default async function ProductsPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role ?? "REP";
  const division = (session?.user as { division?: string | null })?.division;

  const products = await prisma.product.findMany({
    where: { ...getProductMarketWhere(role, division) },
    orderBy: { name: "asc" },
    include: { _count: { select: { forecastItems: true } } },
  });

  return (
    <div className="flex flex-col">
      <Header
        title="Item Master"
        subtitle="Manage your product catalog used across forecasts"
      />
      <main className="flex-1 p-6">
        <ProductsTable initialProducts={products} division={division} />
      </main>
    </div>
  );
}
