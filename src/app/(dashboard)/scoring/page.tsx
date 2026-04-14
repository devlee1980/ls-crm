import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCustomerAccessWhere } from "@/lib/division";
import { Header } from "@/components/layout/Header";
import { ScoringTable } from "@/components/scoring/ScoringTable";

export default async function ScoringPage() {
  const session = await auth();
  const userId = session?.user?.id ?? "";
  const role = (session?.user as { role?: string })?.role ?? "REP";
  const division = (session?.user as { division?: string | null })?.division;

  const customers = await prisma.customer.findMany({
    where: {
      status: { not: "INACTIVE" },
      ...getCustomerAccessWhere(role, userId, division),
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      status: true,
      assignedRep: { select: { name: true } },
      accountScore: true,
    },
  });

  return (
    <div className="flex flex-col">
      <Header
        title="Account Scoring"
        subtitle="Rate US-market customers across 5 categories to determine strategic tier"
      />
      <main className="flex-1 p-6">
        <ScoringTable initialCustomers={customers} />
      </main>
    </div>
  );
}
