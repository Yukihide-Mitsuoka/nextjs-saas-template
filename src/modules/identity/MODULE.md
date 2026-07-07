---
id: module-identity
title: Identity Module
updated: 2026-07-08
---

# Identity Module

Purpose: own the mirror of Clerk identity data (users, organizations, memberships) inside
the app database, and seed each organization's system roles. It does NOT own
authorization decisions (that is `src/shared/auth`), sessions/UI (Clerk), or billing
(Subscription belongs to the billing module).

## Public API (the contract — everything else in this module is private)

| Entry point | Layer | Description |
|-------------|-------|-------------|
| `syncFromClerk(event)` | application | Apply one verified Clerk webhook event to the app DB |
| `DEFAULT_ROLES` | application | The system role set (Owner/Admin/Manager/Member/Billing) and their permissions |
| `POST /api/webhooks/clerk` | interface | Verified (svix) webhook endpoint delegating to `syncFromClerk` |

## Events

| Direction | Event | Schema | Notes |
|-----------|-------|--------|-------|
| consumes | Clerk `user.*`, `organization.*`, `organizationMembership.*` | zod-parsed subset in `interface/clerk-webhook.ts` | Source of truth for identity is Clerk; this module mirrors it |

## Owned data

`User`, `Organization`, `Membership`, `Role`, `RolePermission` rows (writes). Other
modules read them through their own RLS-scoped queries but never write them.

## Invariants (MUST always hold — each maps to a test)

1. Every organization has exactly one member with the Owner system role after sync.
2. Webhook role mapping never downgrades an existing Owner membership.
3. `organization.created` seeds all five system roles with their full permission sets.
4. All writes here use the privileged client (`adminDb`) — webhook events cross tenant
   boundaries by nature; nothing else in the codebase may do this.

## Dependencies

| Uses module | Via | Why |
|-------------|-----|-----|
| — (shared only) | `shared/lib/prisma` (adminDb), `shared/auth/permissions` | persistence + permission vocabulary |
