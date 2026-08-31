# nextjs-saas-template

<!-- repository-readme-owner: Yukihide-Mitsuoka/nextjs-saas-template -->

**Production-ready SaaS starter on the ai-dev-foundation base** — a template repository
for B2B/B2C SaaS where AI agents are the primary developers. It layers a Next.js SaaS
foundation (multi-tenant PostgreSQL RLS, org-scoped RBAC, Clerk auth, Stripe billing,
Cloud Run delivery) on top of everything
[ai-dev-foundation](https://github.com/Yukihide-Mitsuoka/ai-dev-foundation) provides
(rules, guardrails, skills, hooks, CI).

> **AI agents:** stop reading this file. Your entry point is [CLAUDE.md](CLAUDE.md)
> (Claude Code) or [AGENTS.md](AGENTS.md) (everyone else).

## Position in the template ecosystem

```
ai-dev-foundation ──sync──▶ nextjs-saas-template ──sync──▶ your SaaS
   (base template)              (this repo)                   │
                                                              │ uses @v1 / ?ref=vX.Y.Z
                                    gcp-cicd-workflows ◀──────┤  (deploy pipeline)
                                    terraform-gcp-modules ◀───┘  (github-oidc, infra)
```

| Decision | Rule |
|----------|------|
| Building a SaaS app? | "Use this template" **here** |
| Pure infrastructure project? | Use [terraform-gcp-template](https://github.com/Yukihide-Mitsuoka/terraform-gcp-template) |
| Neither (plain project)? | Use [ai-dev-foundation](https://github.com/Yukihide-Mitsuoka/ai-dev-foundation) directly |
| Deploy pipeline | Referenced from [gcp-cicd-workflows](https://github.com/Yukihide-Mitsuoka/gcp-cicd-workflows) `@v1` — never copied |
| Base updates | Arrive as sync PRs (template-sync, manual trigger any time); downstream repoints its sync source to THIS repo |

## Stack and architecture decisions (fixed by design)

| Concern | Decision |
|---------|----------|
| Framework | Next.js App Router (Server Actions + Route Handlers), TypeScript strict, Tailwind CSS |
| Data | Prisma + PostgreSQL (Cloud SQL); **shared schema + `organization_id` + Row Level Security** enforced in the DB, injected per-request via a `$extends` client |
| Auth | Clerk (Organizations) with webhook-driven sync into the app DB |
| Authorization | Fixed permission vocabulary + org-defined custom roles; `hasPermission()` guards **every** layer (middleware, Server Action, Route Handler, service, repository) |
| Billing | Stripe; Organization = Customer, seat + tier, `billing:*` permissions gate it |
| Layout | ARC-001: one feature = one `src/modules/<feature>/{domain,application,infrastructure,interface}` bounded context + `MODULE.md`; `src/shared/` for cross-cutting only; `src/app/` is a thin routing shell |
| Delivery | Container (standalone output) → Cloud Run canary via reusable workflows; OIDC keyless auth via `terraform-gcp-modules//modules/github-oidc` |

Two DB roles are mandatory: the app role (RLS-enforced) and a privileged role used only by
migrations and the Clerk webhook sync (which must write across tenant boundaries).

## Using this template

1. **Create the repo**: GitHub → "Use this template".
2. **Repoint template sync**: in `.github/workflows/template-sync.yml`, set
   `source_repo_path` to `Yukihide-Mitsuoka/nextjs-saas-template`; set repo variable
   `TEMPLATE_SYNC_ENABLED=true`.
3. **Replace placeholders**: `grep -rn "{{" . --exclude-dir=.git --exclude-dir=node_modules`.
4. **Configure services**: Clerk app + webhook endpoint, Stripe account, Cloud SQL
   instance; fill `.env` from [.env.example](.env.example).
5. **Install gates**: `make setup`; verify with `make doctor && make lint && make test`.
6. **Wire deploy**: provision `github-oidc` (see
   [gcp-cicd-workflows setup](https://github.com/Yukihide-Mitsuoka/gcp-cicd-workflows#setup-once-per-consumer-repo)),
   copy its example callers.
7. Point your agent at the repo and assign it an issue.
