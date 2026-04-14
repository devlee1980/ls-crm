import type { Session } from "next-auth";

/**
 * Returns a Prisma `where` fragment that restricts queries to the session
 * user's entity. ADMIN users with no entityId see all entities.
 */
export function getEntityFilter(session: Session): { entityId?: string } {
  const user = session.user as { role?: string; entityId?: string | null };
  if (user.role === "ADMIN" && !user.entityId) {
    return {};
  }
  if (user.entityId) {
    return { entityId: user.entityId };
  }
  // Non-admin with no entity assigned — return an impossible condition so they
  // see nothing until an admin assigns them an entity.
  return { entityId: "__none__" };
}

/**
 * Returns the entityId to stamp onto newly created records.
 * Throws if a non-admin user has no entity assigned.
 */
export function getEntityId(session: Session): string {
  const user = session.user as { role?: string; entityId?: string | null };
  if (!user.entityId) {
    throw new Error("User has no entity assigned. Contact your administrator.");
  }
  return user.entityId;
}
