---
id: module-billing
title: Billing Module
updated: 2026-07-08
---

# Billing Module

Purpose: own the Stripe integration — subscription lifecycle mirroring (webhook),
checkout/portal session creation, and the unpaid-lockout rule. It does NOT own who may
act (`shared/auth`), identity data (identity module), or pricing content (Stripe is the
source of truth for products/prices).

## Public API (the contract — everything else is private)

| Entry point | Layer | Description |
|-------------|-------|-------------|
| `POST /api/webhooks/stripe` | interface | Signature-verified, idempotent event intake |
| `createCheckoutSession(orgId, priceId)` | interface (server action) | Start a subscription purchase (`billing:write`) |
| `createPortalSession(orgId)` | interface (server action) | Open Stripe Customer Portal (`billing:write`) |
| `assertOrgWritable(orgId)` | application | Throw when the org is locked out (canceled/unpaid) — call from write paths of other modules |
| `isWriteBlocked(status)` | domain | The lockout rule itself |

## Events

| Direction | Event | Schema | Notes |
|-----------|-------|--------|-------|
| consumes | Stripe `checkout.session.completed`, `customer.subscription.*`, `invoice.paid`, `invoice.payment_failed` | normalized in `interface/stripe-webhook.ts` | all other types acknowledged + ignored |

## Owned data

`Subscription` rows and the global `StripeEvent` idempotency ledger (writes).

## Invariants (MUST always hold — each maps to a test)

1. An event id is processed at most once (ledger claim happens before any side effect).
2. `past_due` never blocks writes (grace, Stripe dunning runs); `canceled`/`unpaid` block
   every write path except `billing:*` (recovery must stay possible).
3. Unknown/unmapped event types are acknowledged (2xx) without side effects.
4. Webhook-side writes use `adminDb` under ADR-0003's scope only; user-facing actions use
   `dbForOrg` + `requirePermission`.

## Dependencies

| Uses module | Via | Why |
|-------------|-----|-----|
| — (shared only) | `shared/lib/prisma`, `shared/auth`, `shared/lib/errors` | persistence, authz, error funnel |
