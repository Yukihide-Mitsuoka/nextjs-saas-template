import { PermissionDeniedError } from "@/shared/lib/errors";
import { dbForOrg } from "@/shared/lib/prisma";
import type { Permission } from "./permissions";

/**
 * Multi-layer authorization guard — THE choke point every layer calls.
 *
 * Defense in depth (this template's rule): middleware only authenticates; each Server
 * Action, Route Handler, service and repository that does something permissioned calls
 * requirePermission() itself. A layer must never assume an outer layer already checked.
 *
 * Reads go through the RLS-scoped client on purpose: even the permission lookup cannot
 * cross tenants.
 */

export interface PermissionReader {
  permissionsFor(userId: string, organizationId: string): Promise<ReadonlySet<string>>;
}

export const prismaPermissionReader: PermissionReader = {
  async permissionsFor(userId, organizationId) {
    const membership = await dbForOrg(organizationId).membership.findFirst({
      where: { userId, organizationId, status: "ACTIVE" },
      select: { role: { select: { permissions: { select: { permissionCode: true } } } } },
    });
    return new Set(membership?.role.permissions.map((p) => p.permissionCode) ?? []);
  },
};

export async function hasPermission(
  userId: string,
  organizationId: string,
  permission: Permission,
  reader: PermissionReader = prismaPermissionReader,
): Promise<boolean> {
  const granted = await reader.permissionsFor(userId, organizationId);
  return granted.has(permission);
}

/** Throw-on-deny variant for guard clauses: `await requirePermission(u, o, "billing:write")`. */
export async function requirePermission(
  userId: string,
  organizationId: string,
  permission: Permission,
  reader: PermissionReader = prismaPermissionReader,
): Promise<void> {
  if (!(await hasPermission(userId, organizationId, permission, reader))) {
    throw new PermissionDeniedError(permission);
  }
}
