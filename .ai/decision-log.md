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
| 2026-09-04 | LOG-0020 | Port the protected ADR-0021 caller after its inherited policy reached `main`; resolve this inheritable template as a producer from the accepted base checkout, require English PR prose, and preserve Next.js-specific CI checks | [ADR-0021](../docs/foundation/adr/0021-scope-japanese-pull-request-prose-to-leaf-repositories.md) |
| 2026-08-14 | LOG-0019 | Node.js 24移行を保護workflow境界へ手動移植し、5つのJavaScript ActionをFoundation承認済みmajorとcommit SHAへ更新する。欠落していたFoundation回帰テストの所有権と実体も同時に補い、今後の旧major再混入を拒否する | [Issue #100](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/100) |
| 2026-08-14 | LOG-0018 | 受理済み基盤ADR-0014の未完了実装として、Next.js SaaS familyが直接子へ渡すstack、tenant isolation、Clerk/Stripe境界、検証・実行境界をowner-qualified overlayとbootstrap exportで公開する。子のproject identity、workflow、application、Prisma schema、README、project docsは保護し、テンプレート自身のproject overlayは継承しない | [Foundation ADR-0014](../docs/foundation/adr/0014-separate-inherited-agent-contracts-from-project-overlays.md) |
| 2026-08-02 | LOG-0017 | 直接親lockを`ef70594`から最終first-parent commit `74d9255`（ai-dev-foundation release 1.5.2）へ進め、PR #72/#73の継承内容とPR #75の保護workflowに対応する受理来歴を完成させる。子固有CHANGELOG、アプリケーション、GitHub設定は変更しない | [Issue #77](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/77) |
| 2026-08-02 | LOG-0016 | 直接親lockを`919508c`から次のfirst-parent commit `ef70594`（ai-dev-foundation #152）へ進める。旧Scorecard compositeの削除と回帰テストはPR #73で、保護されたdirect callerはPR #75で受理済みのため、実装を二重化せず受理済み状態の来歴を記録する | [Issue #77](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/77) |
| 2026-08-02 | LOG-0015 | 直接親lockを`854b885`から次のfirst-parent commit `919508c`（ai-dev-foundation #149）へ進める。fleet artifactを既存の継承rootへ収める最終内容はPR #72/#73で受理済みであり、保護されたMakefileや中間配置へ戻さず来歴だけを前進させる | [Issue #77](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/77) |
| 2026-08-02 | LOG-0014 | 直接親lockを`cf4ebed`から次のfirst-parent commit `854b885`（ai-dev-foundation release 1.5.1）へ進める。親差分は保護されたFoundation CHANGELOGだけで、PR #72/#73で受理済みの最終継承blobとPR #75のScorecard workflowを変更せず、来歴だけを順序どおり記録する | [Issue #77](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/77) |
| 2026-08-02 | LOG-0013 | 直接親lockを`c3b5dbf`から次のfirst-parent commit `cf4ebed`（ai-dev-foundation #147）へ進める。PR #72/#73で`74d9255`までの最終継承blobを、PR #75で保護されたScorecard workflowを既に受理済みのため、中間commitの内容へ戻さずlockだけを更新する | [Issue #77](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/77) |
| 2026-08-02 | LOG-0012 | 受理済み基盤ADR-0014の直接子migrate段階として、`.ai/guardrails.md`を重複した保護対象ルール本文から基盤所有の薄いadapterへ切り替える。正本`contracts/foundation/guardrails.md`を通常同期し、SaaS固有の強化は宣言済みproject overlayだけに置き、完全に受理した親commitを`c3b5dbf`へ進める | [Issue #66](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/66) |
| 2026-08-01 | LOG-0011 | Implement the accepted foundation ADR-0014 skill boundary by moving the generic `bugfix` skill from protected project ownership to inherited foundation ownership. Future sibling-sweep rule changes arrive through ordinary reviewed Template Sync, while the project-owned regression prevents the skill from returning to the ignore boundary | [Issue #63](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/63) |
| 2026-08-01 | LOG-0010 | Implement the accepted ADR-0014 boundary by loading the inherited foundation contract before a protected nextjs-saas-template project overlay, and protect both the profile and project namespace from legacy Template Sync. This replaces the incorrect foundation repository identity introduced by sync PR #60 without changing application behavior or workflow permissions | [Issue #61](https://github.com/Yukihide-Mitsuoka/nextjs-saas-template/issues/61) |
| 2026-07-22 | LOG-0009 | 直接親lockを `86eb924` から次のfirst-parentコミット `01eb97c`（ai-dev-foundation #57）へ進め、Rulesetのみで保護されたbranchの旧Branch Protection 404を管理権限確認時だけ「不存在」と判定する修正・回帰テスト・runbookを正確に取り込む。権限・通信の曖昧さは引き続きfail-closed `unknown` とする | [Issue #56](https://github.com/Yukihide-Mitsuoka/ai-dev-foundation/issues/56) |
| 2026-07-22 | LOG-0008 | Apply narrow pnpm overrides for patched `sharp` and `brace-expansion` releases; do not suppress known high-severity advisories or expand this inheritance-safety PR into unrelated major dependency upgrades | [package.json](../package.json) |
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
