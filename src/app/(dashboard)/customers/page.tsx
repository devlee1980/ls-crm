import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { CustomersTable } from "@/components/customers/CustomersTable";
import { getDivisionFilter } from "@/lib/division";

async function getCustomers(userId: string, role: string, division?: string | null) {
  return prisma.customer.findMany({
    where: {
      ...getDivisionFilter(role, division),
      ...(role === "REP" ? { assignedRepId: userId } : {}),
    },
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
  const division = (session!.user as { division?: string | null })?.division;

  const customers = await getCustomers(userId, role, division);

  // Reps list is also scoped to the same division so MANAGER can't assign cross-division reps
  const reps = await prisma.user.findMany({
    select: { id: true, name: true },
    where: {
      isActive: true,
      ...(role !== "ADMIN" && division ? { division: division as "LS_US" | "LS_CANADA" } : {}),
    },
    orderBy: { name: "asc" },
  });

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
        <CustomersTable
          initialCustomers={customersWithRevenue}
          reps={reps}
          userRole={role}
          userDivision={division ?? null}
        />
      </main>
    </div>
  );
}
