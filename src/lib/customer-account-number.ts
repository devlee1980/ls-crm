import { prisma } from "@/lib/prisma";

export function isBlankAccountNumber(v: string | null | undefined): boolean {
  return v == null || String(v).trim() === "";
}

export function normalizeAccountNumber(v: string | null | undefined): string | null {
  if (isBlankAccountNumber(v)) return null;
  return String(v).trim();
}

/** Next ACC-001 style number from existing ACC-(digits) accounts. */
export async function nextSequentialAccountNumber(): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: { accountNumber: { startsWith: "ACC-" } },
    select: { accountNumber: true },
  });
  let max = 0;
  for (const c of customers) {
    const m = c.accountNumber?.match(/^ACC-(\d+)$/i);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `ACC-${String(max + 1).padStart(3, "0")}`;
}
