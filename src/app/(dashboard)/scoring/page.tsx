import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ScoringTable } from "@/components/scoring/ScoringTable";

export default async function ScoringPage() {
  await auth();

  const customers = await prisma.customer.findMany({
    where: { status: { not: "INACTIVE" } },
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
