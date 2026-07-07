import type { Permission } from "@/shared/auth/permissions";
import type {
  SyncedMembership,
  SyncedOrganization,
  SyncedUser,
  SystemRoleName,
} from "../domain/types";

/**
 * Persistence port for identity sync (implemented by infrastructure with the privileged
 * client — webhook writes cross tenant boundaries by nature).
 */
export interface IdentitySyncRepository {
  upsertUser(user: SyncedUser): Promise<void>;
  deleteUser(clerkUserId: string): Promise<void>;

  /** Create/update the org, seed system roles if missing, and grant Owner to the creator. */
  upsertOrganization(
    org: SyncedOrganization,
    systemRoles: Record<SystemRoleName, readonly Permission[]>,
  ): Promise<void>;
  deleteOrganization(clerkOrgId: string): Promise<void>;

  /** Upsert a membership with the given system role — MUST NOT downgrade an existing
   *  Owner (MODULE.md invariant 2). */
  upsertMembership(membership: SyncedMembership, roleName: SystemRoleName): Promise<void>;
  deleteMembership(clerkOrgId: string, clerkUserId: string): Promise<void>;
}
