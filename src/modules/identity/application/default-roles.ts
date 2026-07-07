import { ALL_PERMISSIONS, type Permission } from "@/shared/auth/permissions";
import type { SystemRoleName } from "../domain/types";

/**
 * The five system roles seeded into every organization (isSystem = true, not editable).
 * Organizations add custom roles on top; they cannot remove these.
 */
export const DEFAULT_ROLES: Record<SystemRoleName, readonly Permission[]> = {
  Owner: ALL_PERMISSIONS,
  Admin: [
    "org:read",
    "org:manage",
    "member:read",
    "member:invite",
    "member:manage",
    "role:manage",
    "workspace:read",
    "workspace:write",
    "billing:read",
    "audit:read",
  ],
  Manager: ["org:read", "member:read", "member:invite", "workspace:read", "workspace:write"],
  Member: ["org:read", "member:read", "workspace:read"],
  Billing: ["org:read", "billing:read", "billing:write"],
};

export const SYSTEM_ROLE_NAMES = Object.keys(DEFAULT_ROLES) as SystemRoleName[];
