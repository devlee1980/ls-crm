export type DivisionValue = "LS_US" | "LS_CANADA";

/**
 * Returns a Prisma `where` fragment that restricts Customer queries to the
 * session user's division. ADMIN users see all divisions.
 */
export function getDivisionFilter(
  role: string,
  division?: string | null
): { division?: DivisionValue } {
  if (role === "ADMIN" || !division) return {};
  return { division: division as DivisionValue };
}

/**
 * Returns true when a division filter should be applied (non-ADMIN with a
 * known division). Useful for constructing relation-based filters manually.
 */
export function shouldFilterByDivision(
  role: string,
  division?: string | null
): division is DivisionValue {
  return role !== "ADMIN" && !!division;
}
