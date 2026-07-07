---
id: saas-foundation
title: SaaS Foundation — Next.js-specific architecture rules
updated: 2026-07-08
---

# SaaS Foundation — Next.js-specific rules

Delta document: only what ARC-001..004 / COD-\* do not already say (one fact, one place —
DOC-001). The layer rules themselves live in
[.ai/architecture.md](../../.ai/architecture.md).

## Mapping Next.js constructs onto ARC-001 layers

| Next.js construct | Layer | Rule |
|-------------------|-------|------|
| `src/app/**` (pages, layouts, `route.ts`) | none (shell) | Thin: parse/serialize + delegate to a module's `interface/`. No business logic, no direct DB access |
| Server Actions / Route Handlers | `modules/*/interface` | The inbound edge. Verify auth, zod-parse input, call one application use case, map errors via `toSafeError` |
| Use cases | `modules/*/application` | Framework-free. Define ports; take injected repositories (see the identity module) |
| Prisma access | `modules/*/infrastructure` | Implements the module's ports. Tenant data via `dbForOrg(orgId)` ONLY |
| React components/hooks owned by a feature | `modules/*/interface` | UI is part of the inbound edge; shared UI primitives may live in `src/shared/ui` once 3+ modules need them (ARC-004) |

## Tenancy and data access

- `dbForOrg(orgId)` (RLS-scoped) is the only way feature code touches tenant data. The
  org id comes from the authenticated Clerk session — never from client-supplied input.
- `adminDb` (BYPASSRLS role) has exactly two consumers: migrations and the identity
  module's webhook sync. Adding a third requires an ADR.
- RLS is the backstop, not the authorization system: `requirePermission()` decides *may
  this user act*; RLS guarantees *even buggy code cannot read another tenant*.

## Authorization (defense in depth)

Every layer that performs a permissioned operation calls `requirePermission(userId,
orgId, permission)` itself — middleware only authenticates. A permission string is the
`Permission` union type; the vocabulary is fixed (`src/shared/auth/permissions.ts`),
roles are per-organization compositions of it.

## Validation placement

zod schemas live at the boundary that receives untrusted data: webhook payloads and
Server Action/Route Handler inputs (`modules/*/interface`), environment access
(`shared/lib/env.ts`). Application and domain code receives already-typed values and
never re-parses (COD-010).

## Transactions

- Single-aggregate writes: rely on the per-operation transaction the RLS client already
  wraps (set_config + query).
- Multi-step writes inside one module: `$transaction(async tx => ...)` in the
  infrastructure adapter (see `prisma-identity-sync-repository.ts`).
- Cross-module consistency: never a shared DB transaction — modules communicate through
  public APIs/events (ARC-002); accept eventual consistency and design compensations.

## Error handling

Interface edges are the only place errors become HTTP: `toSafeError()` is the single
funnel; `expose=false` errors (infrastructure) never leak details to clients
(`shared/lib/errors.ts`).
