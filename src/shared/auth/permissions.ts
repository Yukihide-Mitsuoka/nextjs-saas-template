/**
 * The FIXED permission vocabulary — single source of truth for authorization.
 *
 * Organizations compose custom roles out of these; they can never invent new permission
 * strings (that is what keeps hasPermission() type-safe end to end). The Permission
 * table is seeded from this list (prisma/migrations/*_rls); a unit test pins the two
 * in sync. Adding a permission = edit here + a migration + the pinned test.
 */
export const PERMISSIONS = {
  "org:read": "Read organization profile and settings",
  "org:manage": "Update organization profile and settings",
  "member:read": "List members and their roles",
  "member:invite": "Invite new members",
  "member:manage": "Change member roles, suspend or remove members",
  "role:manage": "Create, edit and delete custom roles",
  "workspace:read": "View workspaces",
  "workspace:write": "Create, edit and delete workspaces",
  "billing:read": "View subscription and invoices",
  "billing:write": "Change plan, seats and payment method",
  "audit:read": "Read the audit log",
} as const;

export type Permission = keyof typeof PERMISSIONS;

export const ALL_PERMISSIONS = Object.keys(PERMISSIONS) as Permission[];

export function isPermission(value: string): value is Permission {
  return value in PERMISSIONS;
}
