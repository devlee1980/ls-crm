import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UsersTable } from "@/components/users/UsersTable";

export const metadata = { title: "User Management | LS Nexus" };

export default async function UsersPage() {
  const session = await auth();
  const role = (session?.user as { role?: string })?.role;
  if (role !== "ADMIN") redirect("/dashboard");

  const raw = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      division: true,
      region: true,
      isActive: true,
      createdAt: true,
      _count: { select: { customers: true, actionItems: true } },
    },
    orderBy: [{ division: "asc" }, { name: "asc" }],
  });

  // Serialize dates for client component
  const users = raw.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }));

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage team members across LS US and LS Canada.
        </p>
      </div>
      <UsersTable initialUsers={users} currentUserId={session!.user!.id!} />
    </div>
  );
}
