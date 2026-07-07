/**
 * Domain types — plain data, no framework imports (ARC-002). These model the identity
 * facts this module mirrors from the auth provider.
 */

export interface SyncedUser {
  clerkUserId: string;
  email: string;
  name: string | null;
  imageUrl: string | null;
}

export interface SyncedOrganization {
  clerkOrgId: string;
  name: string;
  slug: string;
  /** Clerk user id of the creator — receives the Owner role. */
  createdByClerkUserId: string | null;
}

export interface SyncedMembership {
  clerkOrgId: string;
  clerkUserId: string;
  /** Provider role slug, e.g. "org:admin" / "org:member". */
  providerRole: string;
}

/** System role names — fixed vocabulary for seeded roles. */
export type SystemRoleName = "Owner" | "Admin" | "Manager" | "Member" | "Billing";

/** Provider role slug → system role. Owner is NEVER assigned from a provider slug
 *  (only organization.created's creator gets it) — see MODULE.md invariant 2. */
export function mapProviderRole(providerRole: string): Exclude<SystemRoleName, "Owner"> {
  return providerRole === "org:admin" ? "Admin" : "Member";
}
