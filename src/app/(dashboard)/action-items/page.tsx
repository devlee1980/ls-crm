import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Header } from "@/components/layout/Header";
import { ActionItemsBoard } from "@/components/action-items/ActionItemsBoard";

export default async function ActionItemsPage() {
  const session = await auth();
  const role = (session!.user as { role?: string })?.role ?? "REP";
  const userId = session!.user!.id!;

  const items = await prisma.actionItem.findMany({
    where: role === "REP" ? { assignedToId: userId } : {},
    include: {
      customer: { select: { id: true, name: true } },
      assignedTo: { select: { id: true, name: true } },
    },
    orderBy: [{ dueDate: "asc" }, { createdAt: "desc" }],
  });

  const customers = await prisma.customer.findMany({
    where: role === "REP" ? { assignedRepId: userId } : {},
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  const reps = await prisma.user.findMany({
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col">
      <Header
        title="Action Items"
        subtitle="Track follow-ups, tasks, and commitments across your accounts"
      />
      <main className="flex-1 p-6">
        <ActionItemsBoard initialItems={items} customers={customers} reps={reps} />
      </main>
    </div>
  );
}
