import { PrismaClient } from "@prisma/client";
import { env } from "./env";

/**
 * Two clients, two trust levels — the heart of the RLS setup:
 *
 * dbForOrg(orgId)  RLS-ENFORCED tenant client. Every operation is batched into a
 *                  transaction whose first statement is
 *                  `SELECT set_config('app.current_org_id', orgId, TRUE)`, so the
 *                  policy variable is set on the SAME connection the query uses
 *                  (SET LOCAL semantics: it dies with the transaction — no leakage
 *                  across pooled connections). Forgetting the org is impossible by
 *                  construction, and an unset variable matches zero rows (default deny
 *                  — see prisma/migrations/*_rls).
 *
 * adminDb          PRIVILEGED client on DIRECT_DATABASE_URL (a BYPASSRLS role). Only
 *                  two legitimate consumers exist: schema migrations and the Clerk
 *                  webhook sync (identity module), which must write across tenants.
 *                  Never inject it into feature modules.
 */

const globalForPrisma = globalThis as unknown as {
  basePrisma?: PrismaClient;
  adminPrisma?: PrismaClient;
};

function makeBaseClient(): PrismaClient {
  return new PrismaClient({ datasourceUrl: env().DATABASE_URL });
}

function makeAdminClient(): PrismaClient {
  return new PrismaClient({ datasourceUrl: env().DIRECT_DATABASE_URL });
}

/** App-role client (RLS applies, but no org context — use dbForOrg instead). */
const basePrisma: PrismaClient = (globalForPrisma.basePrisma ??= makeBaseClient());

/** Privileged client — migrations and cross-tenant sync ONLY. */
export const adminDb: PrismaClient = (globalForPrisma.adminPrisma ??= makeAdminClient());

export type TenantClient = ReturnType<typeof makeTenantClient>;

function makeTenantClient(organizationId: string) {
  return basePrisma.$extends({
    name: `tenant:${organizationId}`,
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          // Array-form $transaction guarantees both statements share one connection,
          // in order; set_config(..., TRUE) is transaction-local (SET LOCAL).
          const [, result] = await basePrisma.$transaction([
            basePrisma.$executeRaw`SELECT set_config('app.current_org_id', ${organizationId}, TRUE)`,
            query(args),
          ]);
          return result;
        },
      },
    },
  });
}

const tenantClients = new Map<string, TenantClient>();

/** RLS-scoped client for one organization. Cached per org (extension setup is cheap
 *  but not free; the underlying connection pool is shared either way). */
export function dbForOrg(organizationId: string): TenantClient {
  let client = tenantClients.get(organizationId);
  if (client === undefined) {
    client = makeTenantClient(organizationId);
    tenantClients.set(organizationId, client);
  }
  return client;
}
