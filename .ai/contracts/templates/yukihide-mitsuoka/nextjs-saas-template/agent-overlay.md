---
id: nextjs-saas-template-family-agent-overlay
title: Next.js SaaS Template Family Agent Overlay
authority: 3
read_when: [agent-entry]
---

# Next.js SaaS Template Family Agent Overlay

This owner-qualified template layer contains SaaS family rules intentionally exported
to direct descendants. Repository identity and product-specific choices remain in each
repository's protected project overlay.

- Stack: Next.js App Router and strict TypeScript, with `src/app/` kept as a thin
  routing and composition layer.
- Architecture: SaaS capabilities are bounded contexts under `src/modules/`; shared
  code remains domain-free and is introduced only after demonstrated reuse.
- Tenant isolation: persisted tenant-owned data carries an organization identifier and
  PostgreSQL row-level security remains the database enforcement boundary.
- Authentication and billing: Clerk and Stripe integrations remain adapters around
  application-owned authorization and billing policies; webhook handling must verify
  signatures and remain idempotent.
- Verification: use the descendant repository's canonical `make` targets for formatting,
  type checking, tests, coverage, build, and security checks.
- Execution boundary: database migration, external-service configuration, and cloud
  deployment are separate authenticated operations requiring explicit authorization.
- Ownership: descendants must not reuse this template repository's protected project
  overlay as their repository identity or local exception layer.
