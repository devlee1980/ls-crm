import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { PipelineBoard } from "@/components/pipeline/PipelineBoard";

export default async function PipelinePage() {
  const session = await auth();
  const userId = session!.user!.id!;
  const role = (session!.user as { role?: string })?.role ?? "REP";

  const whereClause = role === "REP" ? { assignedRepId: userId } : {};

  const [deals, customers, reps] = await Promise.all([
    prisma.pipelineDeal.findMany({
      where: whereClause,
      include: {
        customer: { select: { id: true, name: true } },
        assignedRep: { select: { id: true, name: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.customer.findMany({
      select: { id: true, name: true },
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
    }),
    prisma.user.findMany({
      select: { id: true, name: true },
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const serializedDeals = deals.map((d) => ({
    ...d,
    expectedClose: d.expectedClose ? d.expectedClose.toISOString() : null,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
  }));

  return (
    <div className="flex flex-col">
      <Header
        title="Pipeline"
        subtitle="Track deals from first contact to close."
      />
      <main className="flex-1 p-6">
        <PipelineBoard
          initialDeals={serializedDeals as never}
          customers={customers}
          reps={reps}
        />
      </main>
    </div>
  );
}
