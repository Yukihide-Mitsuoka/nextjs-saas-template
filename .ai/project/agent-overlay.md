---
id: nextjs-saas-template-agent-overlay
title: Next.js SaaS Template Agent Overlay
authority: 3
read_when: [agent-entry]
---

# Next.js SaaS Template Agent Overlay

This protected project layer contains repository identity and stack facts only. The
explicit agent profile loads it after the inherited foundation contract.

- Repository: `Yukihide-Mitsuoka/nextjs-saas-template`.
- Role: reusable SaaS application template for Next.js services.
- Stack: Next.js App Router, TypeScript, Prisma with PostgreSQL row-level security,
  Clerk authentication, and Stripe billing.
- Architecture: each SaaS feature is a bounded context under `src/modules/`; `src/app/`
  remains a thin routing layer.
- Deployment target: Google Cloud Run through the reviewed `gcp-cicd-workflows` release
  line.
- Execution model: database migrations, cloud deployments, and external-service
  configuration are separate authenticated operations.
