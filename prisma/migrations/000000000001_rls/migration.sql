-- Row Level Security — tenant isolation enforced IN the database.
--
-- Contract with the application (src/shared/lib/prisma.ts):
--   every tenant-scoped query runs inside a transaction that first executes
--   SELECT set_config('app.current_org_id', <orgId>, TRUE);
--   current_setting(..., true) returns NULL when unset -> policies match nothing
--   (default deny: forgetting to set the org yields zero rows, never a leak).
--
-- Role contract (create the roles in infrastructure, not here):
--   app_user  — the application's connection role. RLS applies. Granted DML below
--               (grants are conditional so local/dev databases without the role still
--               migrate cleanly).
--   app_admin — migrations + Clerk webhook sync. MUST carry the BYPASSRLS attribute
--               (cross-tenant writes happen only through this role).

-- Organization: a session can see exactly its own org row.
ALTER TABLE "Organization" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Organization" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Organization"
  FOR ALL
  USING ("id" = current_setting('app.current_org_id', true))
  WITH CHECK ("id" = current_setting('app.current_org_id', true));

-- Tenant-owned tables: isolation on organizationId.
ALTER TABLE "Workspace" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workspace" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Workspace"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "Role" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Role" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Role"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "RolePermission" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "RolePermission" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "RolePermission"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "Membership" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Membership" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Membership"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "AuditLog"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- Audit logs are append-only for the app role: no UPDATE/DELETE policy would help since
-- FOR ALL already gates rows, so revoke the verbs themselves below (grants section).

ALTER TABLE "Subscription" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription" FORCE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON "Subscription"
  FOR ALL
  USING ("organizationId" = current_setting('app.current_org_id', true))
  WITH CHECK ("organizationId" = current_setting('app.current_org_id', true));

-- Global reference data: User and Permission carry no org column. The app role may read
-- them; writes stay with app_admin (webhook sync / migrations).

-- Seed the fixed permission vocabulary (mirrors src/shared/auth/permissions.ts; a unit
-- test pins the two in sync).
INSERT INTO "Permission" ("code", "description") VALUES
  ('org:read',        'Read organization profile and settings'),
  ('org:manage',      'Update organization profile and settings'),
  ('member:read',     'List members and their roles'),
  ('member:invite',   'Invite new members'),
  ('member:manage',   'Change member roles, suspend or remove members'),
  ('role:manage',     'Create, edit and delete custom roles'),
  ('workspace:read',  'View workspaces'),
  ('workspace:write', 'Create, edit and delete workspaces'),
  ('billing:read',    'View subscription and invoices'),
  ('billing:write',   'Change plan, seats and payment method'),
  ('audit:read',      'Read the audit log')
ON CONFLICT ("code") DO UPDATE SET "description" = EXCLUDED."description";

-- Grants for the app role (conditional: local databases without the role still migrate).
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'app_user') THEN
    GRANT USAGE ON SCHEMA public TO app_user;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_user;
    -- Append-only audit: the app role can write and read, never rewrite history.
    REVOKE UPDATE, DELETE ON "AuditLog" FROM app_user;
    -- Global reference data is read-only for the app.
    REVOKE INSERT, UPDATE, DELETE ON "Permission" FROM app_user;
    REVOKE INSERT, UPDATE, DELETE ON "User" FROM app_user;
  END IF;
END
$$;
