import { NotFoundError, UnauthenticatedError } from "@/shared/lib/errors";
import { adminDb } from "@/shared/lib/prisma";

/**
 * Public API: resolve a Clerk session (clerkUserId + clerkOrgId) to app-database ids.
 * This module owns the Clerk↔app id mapping, so the read-only unique lookups live here
 * under its privileged mandate (User is global; the Organization row is RLS-guarded and
 * cannot be found by clerkOrgId before the org context exists — the chicken-and-egg
 * every request starts with).
 */
export interface Actor {
  userId: string;
  organizationId: string;
}

export async function resolveActor(
  clerkUserId: string | null,
  clerkOrgId: string | null | undefined,
): Promise<Actor> {
  if (clerkUserId === null || clerkOrgId === null || clerkOrgId === undefined) {
    throw new UnauthenticatedError("Sign in and select an organization");
  }
  const [user, organization] = await Promise.all([
    adminDb.user.findUnique({ where: { clerkUserId }, select: { id: true } }),
    adminDb.organization.findUnique({ where: { clerkOrgId }, select: { id: true } }),
  ]);
  if (user === null || organization === null) {
    throw new NotFoundError("account mapping (webhook sync pending?)");
  }
  return { userId: user.id, organizationId: organization.id };
}
