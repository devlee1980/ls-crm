import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { CustomersTable } from "@/components/customers/CustomersTable";

async function getCustomers(userId: string, role: string) {
  const where = role === "REP" ? { assignedRepId: userId } : {};
  return prisma.customer.findMany({
    where,
    include: {
      assignedRep: { select: { name: true } },
      _count: { select: { locations: true, contacts: true, actionItems: true } },
      revenueRecords: { select: { totalAmount: true } },
    },
    orderBy: { name: "asc" },
  });
}

export default async function CustomersPage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string })?.role ?? "REP";

  const customers = await getCustomers(userId, role);
  const reps = await prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } });

  const customersWithRevenue = customers.map((c) => ({
    ...c,
    totalRevenue: c.revenueRecords.reduce((s, r) => s + r.totalAmount, 0),
  }));

  return (
    <div className="flex flex-col">
      <Header
        title="Customers"
        subtitle="Manage your customer accounts, contacts, and locations"
      />
      <main className="flex-1 p-6">
        <CustomersTable initialCustomers={customersWithRevenue} reps={reps} />
      </main>
    </div>
  );
}
