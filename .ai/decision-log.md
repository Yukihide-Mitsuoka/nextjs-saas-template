---
id: decision-log
title: Decision Log
authority: 4
read_when: [architecture-change, planning, onboarding]
---

# Decision Log

Append-only index of decisions. Newest first. Two kinds of entries:

- **ADR-linked**: architectural decisions — full context lives in `docs/adr/`.
- **Lightweight**: decisions too small for an ADR but worth remembering (COD-052).

Rules: never edit or delete past entries; supersede with a new entry that references the
old one. One line per entry. AI agents append entries in the same PR as the change.

| Date | ID | Decision | Link |
|------|----|----------|------|
| 2026-07-18 | ADR-0005 (accepted) | Repository owner approved the narrowly authenticated GR-020 exception for mechanical foundation sync PRs by merging PR #15; all other CI and human review remain mandatory | [ADR-0005](../docs/adr/0005-allow-bot-authenticated-foundation-sync-size-exceptions.md) |
| 2026-07-18 | ADR-0005 (proposed) | Permit a GR-020 hard-limit exception only for same-repository, GitHub Actions bot-authored foundation sync PRs with branch, base, and source-commit provenance checks; all other CI and human review remain mandatory | [ADR-0005](../docs/adr/0005-allow-bot-authenticated-foundation-sync-size-exceptions.md) |
| 2026-07-18 | ADR-0004 (accepted) | Repository owner approved target ownership for `.github/workflows/**`; legacy Template Sync remains least-privileged and workflow changes arrive through explicit reviewed PRs | [ADR-0004](../docs/adr/0004-keep-workflows-target-owned-during-template-sync.md) |
| 2026-07-18 | ADR-0004 (proposed) | Keep `.github/workflows/**` target-owned so legacy Template Sync remains least-privileged and cannot fail while pushing executable workflow changes | [ADR-0004](../docs/adr/0004-keep-workflows-target-owned-during-template-sync.md) |
| 2026-07-03 | LOG-0007 | Markdown formatting MUST be frontmatter-aware: mdformat pinned via pre-commit with `mdformat-frontmatter` + `mdformat-gfm`, config in `.mdformat.toml` (`wrap=keep`, `number=true`). A naive run once collapsed all YAML frontmatter into headings — never use a formatter without these plugins | [.mdformat.toml](../.mdformat.toml) |
| 2026-07-02 | ADR-0002 | AI-facing docs are written in English | [ADR-0002](../docs/foundation/adr/0002-ai-facing-docs-in-english.md) |
| 2026-07-02 | ADR-0001 | Record architecture decisions as ADRs | [ADR-0001](../docs/foundation/adr/0001-record-architecture-decisions.md) |
| 2026-07-02 | LOG-0006 | `guard-bash.sh` must work when `jq` is absent (the `\|\| cat` fallback greps raw hook JSON); GR-010/011 patterns therefore treat `"` as a token terminator. Do not "simplify" that away. Verified by a matrix test on both paths | — |
| 2026-07-02 | LOG-0005 | AI PR review runs via `ai-review.yml`, disabled by default (repo var `ENABLE_AI_REVIEW`); supplements, never replaces, human review | — |
| 2026-07-02 | LOG-0004 | Template updates distribute via actions-template-sync PRs; downstream-customized files protected by `.templatesyncignore` | — |
| 2026-07-02 | LOG-0003 | GitHub governance (branch protection etc.) bootstrapped by `scripts/setup-github.sh` (gh CLI, idempotent) instead of a Probot app — no extra runtime dependency | — |
| 2026-07-02 | LOG-0002 | Canonical make targets are a binding contract (check-only lint, no `%:` catch-all, GR-031-guarded destructive targets); stack examples live in `profiles/` | [profiles/README.md](../profiles/README.md) |
| 2026-07-02 | LOG-0001 | Skills are vendor-neutral files in `.skills/`, routed via CLAUDE.md table instead of duplicated `.claude/skills/` wrappers | — |
