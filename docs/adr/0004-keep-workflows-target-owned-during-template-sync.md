---
id: adr-0004
title: Keep workflows target-owned during template sync
status: accepted
updated: 2026-07-18
---

# ADR-0004: Keep workflows target-owned during Template Sync

| Field | Value |
|-------|-------|
| Status | accepted |
| Date | 2026-07-18 |
| Deciders | repository owner (approved 2026-07-18) |
| Author | Codex (AI agent) |
| Supersedes / Superseded by | Refines LOG-0004 |

## Context

The legacy Template Sync workflow uses the job-scoped `GITHUB_TOKEN` with `contents:
write` and `pull-requests: write`. A sync from `ai-dev-foundation` attempted to update
`.github/workflows/ai-review.yml`; GitHub rejected the push because the GitHub App token
does not have the separate `Workflows: write` repository permission.

GitHub does not expose that permission through workflow `permissions:` for the default
`GITHUB_TOKEN`. Supplying it requires a PAT or a separately managed GitHub App token.
This repository currently stores no privileged synchronization credential, and its
stack-specific CI and direct-parent Template Sync workflows are already target-owned.

The fix must restore reliable synchronization without broadening credential scope,
adding secret rotation work, or allowing upstream changes to overwrite target-specific
workflow adaptations.

## Options considered

### Option 1: Keep the current partial workflow ownership

Continue protecting only `ci.yml` and `template-sync.yml`. This needs no migration, but
any upstream change to another workflow causes the same push rejection, so scheduled and
manual sync remain unreliable.

### Option 2: Add a PAT or GitHub App with Workflows write permission

Pass a privileged token through `target_gh_token`. This retains automatic workflow
propagation, but adds a high-impact credential, rotation and revocation duties, and a
broader write path than the current least-privilege design.

### Option 3: Make all workflows target-owned

Exclude `.github/workflows/**` from Template Sync. Port relevant upstream workflow
changes through reviewed target PRs; let Renovate manage GitHub Action versions and pin
digests. This preserves the current token boundary and makes ownership path-based, but
workflow changes no longer propagate automatically.

### Option 4: Replace legacy Template Sync with manifest materialization now

Adopt the local-first inheritance reconciler before resuming synchronization. This is
the intended long-term direction, but materialization is not yet available and cannot
fix the current failed run incrementally.

## Decision

Adopt Option 3. `.github/workflows/**` MUST be target-owned and excluded from legacy
Template Sync. The sync job MUST continue using only the job-scoped `GITHUB_TOKEN` with
the existing `contents: write` and `pull-requests: write` permissions; it MUST NOT add a
PAT or GitHub App credential solely to synchronize workflows.

Relevant upstream workflow changes MUST be ported through explicit reviewed PRs.
Renovate remains responsible for GitHub Action version updates and digest pinning.

## Consequences

**Positive:** Template Sync can push non-workflow changes without a privileged secret;
workflow ownership matches the stack-specific adaptations; and a compromised sync job
cannot rewrite executable workflows through an additional long-lived credential.

**Negative:** upstream workflow fixes require a separate target PR; maintainers must
review upstream workflow diffs; and Template Sync no longer provides workflow drift
detection.

**Migration and rollback:** add the workflow namespace to `.templatesyncignore`, port
the pending checkout runtime update locally, and pin the boundary with a target-owned
regression test. The stack-specific `.gitignore` is also target-owned because replacing
it with the language-neutral foundation file would drop Next.js build exclusions.
Rollback removes the ignore rule only after a reviewed GitHub App or PAT design supplies
the minimum `Workflows: write` permission and its rotation process.

**Follow-ups:** update the decision log and ADR index; document manual workflow-porting
in the ignore file; keep the downstream-only regression test separate from the
synchronized foundation check; then rerun Template Sync and verify that it creates a PR
without changing `.github/workflows/**`.
