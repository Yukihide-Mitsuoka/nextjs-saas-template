---
id: adr-0003
title: Billing webhook is the third privileged-client consumer
status: accepted
updated: 2026-07-08
---

# ADR-0003: Billing webhook uses the privileged (BYPASSRLS) client

## Context

`docs/architecture/saas-foundation.md` fixes the rule: `adminDb` has exactly two
consumers (migrations, identity webhook sync) and adding a third requires an ADR.
Stripe webhooks arrive identified by Stripe ids (`customer`, event id), not by an
organization id: resolving which tenant an event belongs to requires a cross-tenant
lookup (`Subscription.stripeCustomerId -> organizationId`), and the idempotency ledger
(`StripeEvent`) is global by nature.

## Decision

The billing module's webhook path (interface + its repository) becomes the third
legitimate `adminDb` consumer. Scope is limited to: the `StripeEvent` ledger,
customer→org resolution, and `Subscription` upserts. All user-facing billing reads and
actions (checkout/portal sessions, status display) keep using `dbForOrg` + `billing:*`
permissions.

## Consequences

- The consumer list is now: migrations, identity sync, billing webhook. A fourth still
  requires an ADR.
- `StripeEvent` is revoked from the app role entirely — replay bookkeeping cannot be
  tampered with by tenant-scoped code.
