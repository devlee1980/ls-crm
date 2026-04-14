import { prisma } from "@/lib/prisma";
import { shouldFilterByDivision, type DivisionValue } from "@/lib/division";

export async function assertPipelineDealRefsAllowed(
  role: string,
  division: string | null | undefined,
  customerId: string | null | undefined,
  assignedRepId: string | null | undefined
): Promise<{ ok: true } | { ok: false; message: string }> {
  if (role === "ADMIN" || !division || !shouldFilterByDivision(role, division)) {
    return { ok: true };
  }
  const div = division as DivisionValue;
  if (customerId) {
    const c = await prisma.customer.findFirst({
      where: { id: customerId, division: div },
      select: { id: true },
    });
    if (!c) return { ok: false, message: "Customer not found or not in your division" };
  }
  if (assignedRepId) {
    const u = await prisma.user.findFirst({
      where: { id: assignedRepId, division: div },
      select: { id: true },
    });
    if (!u) return { ok: false, message: "Assigned rep not found or not in your division" };
  }
  return { ok: true };
}
