import { mapProviderRole } from "../domain/types";
import type { SyncedMembership, SyncedOrganization, SyncedUser } from "../domain/types";
import { DEFAULT_ROLES } from "./default-roles";
import type { IdentitySyncRepository } from "./ports";

/**
 * Use case: apply one verified Clerk webhook event to the app database.
 * The interface layer owns payload verification/parsing; this receives typed events.
 */

export type ClerkSyncEvent =
  | { type: "user.created" | "user.updated"; user: SyncedUser }
  | { type: "user.deleted"; clerkUserId: string }
  | { type: "organization.created" | "organization.updated"; organization: SyncedOrganization }
  | { type: "organization.deleted"; clerkOrgId: string }
  | {
      type: "organizationMembership.created" | "organizationMembership.updated";
      membership: SyncedMembership;
    }
  | { type: "organizationMembership.deleted"; clerkOrgId: string; clerkUserId: string };

export async function syncFromClerk(
  event: ClerkSyncEvent,
  repository: IdentitySyncRepository,
): Promise<void> {
  switch (event.type) {
    case "user.created":
    case "user.updated":
      await repository.upsertUser(event.user);
      return;
    case "user.deleted":
      await repository.deleteUser(event.clerkUserId);
      return;
    case "organization.created":
    case "organization.updated":
      await repository.upsertOrganization(event.organization, DEFAULT_ROLES);
      return;
    case "organization.deleted":
      await repository.deleteOrganization(event.clerkOrgId);
      return;
    case "organizationMembership.created":
    case "organizationMembership.updated":
      await repository.upsertMembership(
        event.membership,
        mapProviderRole(event.membership.providerRole),
      );
      return;
    case "organizationMembership.deleted":
      await repository.deleteMembership(event.clerkOrgId, event.clerkUserId);
      return;
  }
}
