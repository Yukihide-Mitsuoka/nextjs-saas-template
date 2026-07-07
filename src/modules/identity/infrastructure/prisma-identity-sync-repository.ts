import type { Permission } from "@/shared/auth/permissions";
import { adminDb } from "@/shared/lib/prisma";
import { logger } from "@/shared/lib/logger";
import type {
  SyncedMembership,
  SyncedOrganization,
  SyncedUser,
  SystemRoleName,
} from "../domain/types";
import type { IdentitySyncRepository } from "../application/ports";

/**
 * Privileged-client implementation. This file is one of the only two legitimate adminDb
 * consumers (the other being migrations) — webhook events cross tenant boundaries.
 */
export const prismaIdentitySyncRepository: IdentitySyncRepository = {
  async upsertUser(user: SyncedUser) {
    await adminDb.user.upsert({
      where: { clerkUserId: user.clerkUserId },
      create: {
        clerkUserId: user.clerkUserId,
        email: user.email,
        name: user.name,
        imageUrl: user.imageUrl,
      },
      update: { email: user.email, name: user.name, imageUrl: user.imageUrl },
    });
  },

  async deleteUser(clerkUserId: string) {
    await adminDb.user.deleteMany({ where: { clerkUserId } });
  },

  async upsertOrganization(
    org: SyncedOrganization,
    systemRoles: Record<SystemRoleName, readonly Permission[]>,
  ) {
    await adminDb.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({
        where: { clerkOrgId: org.clerkOrgId },
        create: { clerkOrgId: org.clerkOrgId, name: org.name, slug: org.slug },
        update: { name: org.name, slug: org.slug },
      });

      // Seed system roles idempotently (MODULE.md invariant 3).
      for (const [name, permissions] of Object.entries(systemRoles)) {
        const role = await tx.role.upsert({
          where: { organizationId_name: { organizationId: organization.id, name } },
          create: { organizationId: organization.id, name, isSystem: true },
          update: { isSystem: true },
        });
        for (const permissionCode of permissions) {
          await tx.rolePermission.upsert({
            where: { roleId_permissionCode: { roleId: role.id, permissionCode } },
            create: { organizationId: organization.id, roleId: role.id, permissionCode },
            update: {},
          });
        }
      }

      // Creator becomes Owner (MODULE.md invariant 1).
      if (org.createdByClerkUserId !== null) {
        const creator = await tx.user.findUnique({
          where: { clerkUserId: org.createdByClerkUserId },
        });
        const ownerRole = await tx.role.findUnique({
          where: { organizationId_name: { organizationId: organization.id, name: "Owner" } },
        });
        if (creator !== null && ownerRole !== null) {
          await tx.membership.upsert({
            where: {
              organizationId_userId: { organizationId: organization.id, userId: creator.id },
            },
            create: {
              organizationId: organization.id,
              userId: creator.id,
              roleId: ownerRole.id,
            },
            update: { roleId: ownerRole.id },
          });
        } else {
          // user.created may arrive after organization.created — the membership webhook
          // will still create the row; Owner is then granted on organization.updated.
          logger.warn("identity: creator or Owner role missing during org upsert", {
            clerkOrgId: org.clerkOrgId,
          });
        }
      }
    });
  },

  async deleteOrganization(clerkOrgId: string) {
    await adminDb.organization.deleteMany({ where: { clerkOrgId } });
  },

  async upsertMembership(membership: SyncedMembership, roleName: SystemRoleName) {
    await adminDb.$transaction(async (tx) => {
      const [user, organization] = await Promise.all([
        tx.user.findUnique({ where: { clerkUserId: membership.clerkUserId } }),
        tx.organization.findUnique({ where: { clerkOrgId: membership.clerkOrgId } }),
      ]);
      if (user === null || organization === null) {
        // Out-of-order delivery: the user/org event has not landed yet. Clerk retries
        // failed deliveries, so failing loudly here is the correct recovery path.
        throw new Error(
          `identity: membership sync before user/org exists (org=${membership.clerkOrgId})`,
        );
      }

      const existing = await tx.membership.findUnique({
        where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
        include: { role: true },
      });
      // Never downgrade an Owner from a provider slug (MODULE.md invariant 2).
      if (existing?.role.name === "Owner") return;

      const role = await tx.role.findUnique({
        where: { organizationId_name: { organizationId: organization.id, name: roleName } },
      });
      if (role === null) {
        throw new Error(`identity: system role ${roleName} missing (org=${membership.clerkOrgId})`);
      }

      await tx.membership.upsert({
        where: { organizationId_userId: { organizationId: organization.id, userId: user.id } },
        create: { organizationId: organization.id, userId: user.id, roleId: role.id },
        update: { roleId: role.id, status: "ACTIVE" },
      });
    });
  },

  async deleteMembership(clerkOrgId: string, clerkUserId: string) {
    const [user, organization] = await Promise.all([
      adminDb.user.findUnique({ where: { clerkUserId } }),
      adminDb.organization.findUnique({ where: { clerkOrgId } }),
    ]);
    if (user === null || organization === null) return; // nothing to delete
    await adminDb.membership.deleteMany({
      where: { organizationId: organization.id, userId: user.id },
    });
  },
};
