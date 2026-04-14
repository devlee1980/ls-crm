import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ProductsTable } from "@/components/products/ProductsTable";

export default async function ProductsPage() {
  await auth();

  const products = await prisma.product.findMany({
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
        <ProductsTable initialProducts={products} />
      </main>
    </div>
  );
}
