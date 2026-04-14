import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { CustomerDetail } from "@/components/customers/CustomerDetail";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await auth();
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      assignedRep: { select: { id: true, name: true } },
      locations: { orderBy: [{ isPrimary: "desc" }, { createdAt: "asc" }] },
      contacts: { orderBy: [{ isPrimary: "desc" }, { lastName: "asc" }] },
      actionItems: {
        include: { assignedTo: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
      },
      forecasts: {
        include: { rep: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      },
      revenueRecords: {
        include: { items: { include: { product: { select: { name: true, sku: true } } } } },
        orderBy: { date: "desc" },
      },
      attachments: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!customer) notFound();

  const reps = await prisma.user.findMany({
    select: { id: true, name: true },
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
        title={customer.name}
        subtitle={customer.accountNumber ? `Account #${customer.accountNumber}` : customer.industry ?? undefined}
      />
      <main className="flex-1 p-6">
        <CustomerDetail customer={customer} reps={reps} products={products} />
      </main>
    </div>
  );
}
