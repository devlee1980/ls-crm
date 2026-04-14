import type { Prisma } from "@prisma/client";

export type DivisionValue = "LS_US" | "LS_CANADA";

/**
 * Restricts Product queries by `market` for non-ADMIN users with a division.
 * ADMIN or missing division: no market filter.
 */
export function getProductMarketWhere(
  role: string,
  division?: string | null
): Prisma.ProductWhereInput {
  if (role === "ADMIN" || !division) return {};
  if (division === "LS_US") return { market: { in: ["US", "Both"] } };
  if (division === "LS_CANADA") return { market: { in: ["Canada", "Both"] } };
  return {};
}

/**
 * Same customer visibility as the Customers list: division (except ADMIN) and
 * REP scoped to assigned accounts.
 */
export function getCustomerAccessWhere(
  role: string,
  userId: string,
  division?: string | null
): Prisma.CustomerWhereInput {
  return {
    ...getDivisionFilter(role, division),
    ...(role === "REP" ? { assignedRepId: userId } : {}),
  };
}

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

/**
 * Pipeline deals visible to the user: REP sees own deals; MANAGER with division
 * sees deals for reps in that division; non-ADMIN with a division also requires
 * the linked customer to be in that division (or no customer yet on the deal).
 */
/**
 * Forecasts: REP sees own; MANAGER with division sees reps in that division;
 * non-ADMIN with a division also requires the forecast customer to be in that division.
 */
export function getForecastAccessWhere(
  role: string,
  userId: string,
  division?: string | null
): Prisma.ForecastWhereInput {
  if (role === "ADMIN") {
    return {};
  }

  const repScope: Prisma.ForecastWhereInput =
    role === "REP"
      ? { repId: userId }
      : role === "MANAGER" && shouldFilterByDivision(role, division)
        ? { rep: { division: division as DivisionValue } }
        : {};

  if (!shouldFilterByDivision(role, division)) {
    return repScope;
  }

  const divFragment = getDivisionFilter(role, division);
  return {
    AND: [repScope, { customer: divFragment }],
  };
}

export function getPipelineDealWhere(
  role: string,
  userId: string,
  division?: string | null
): Prisma.PipelineDealWhereInput {
  if (role === "ADMIN") {
    return {};
  }

  const repOrManager: Prisma.PipelineDealWhereInput =
    role === "REP"
      ? { assignedRepId: userId }
      : role === "MANAGER" && shouldFilterByDivision(role, division)
        ? { assignedRep: { division: division as DivisionValue } }
        : {};

  if (!shouldFilterByDivision(role, division)) {
    return repOrManager;
  }

  const divFragment = getDivisionFilter(role, division);
  return {
    AND: [
      repOrManager,
      {
        OR: [{ customer: divFragment }, { customerId: null }],
      },
    ],
  };
}
