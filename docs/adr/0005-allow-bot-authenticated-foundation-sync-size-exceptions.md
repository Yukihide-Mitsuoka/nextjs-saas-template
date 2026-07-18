---
id: adr-0005
title: Allow bot-authenticated foundation sync size exceptions
status: accepted
updated: 2026-07-18
---

# ADR-0005: Allow bot-authenticated foundation sync size exceptions

| Field | Value |
|-------|-------|
| Status | accepted |
| Date | 2026-07-18 |
| Deciders | repository owner (approved by merging PR #15 on 2026-07-18) |
| Author | Codex (AI agent) |
| Supersedes / Superseded by | Refines GR-020 for authenticated foundation synchronization |

## Context

The first successful Template Sync after restoring downstream documentation inheritance
created PR #13 with 43 files and approximately 4,400 changed lines. Most of the diff is
the initial import of reviewed foundation governance code and its tests. The existing
GR-020 CI check rejects every PR over 800 lines or 20 files, so the repository cannot
accept this foundation state even when every functional and security check passes.

The exception cannot be added to the failing sync PR itself because GR-012 requires a
check correction to be reviewed separately. It must not weaken unrelated pull requests,
grant workflow-write credentials, auto-merge generated changes, or remove human review.
The source repository and bot identity are already fixed by the target-owned Template
Sync workflow.

## Options considered

### Option 1: Do nothing

Keep the unconditional hard limit and close PR #13. This has no policy blast radius, but
the downstream repository remains permanently behind its foundation and later syncs
continue to include the same blocked initial import.

### Option 2: Manually split the initial import into small PRs

Rebuild the generated diff as a long series of hand-authored PRs under 800 lines and 20
files. This keeps the current check unchanged, but large single foundation files would
need artificial partial-file commits, intermediate states would be incomplete, and
future downstream repositories would repeat the same high-cost migration.

### Option 3: Add a narrowly authenticated sync exception

Retain the hard limit for ordinary PRs but treat it as a warning when all of these facts
hold: the PR author is `github-actions[bot]`; the head repository is this repository; the
branch uses the `chore/template_sync_` prefix; the base is `main`; and the PR body records
the configured `ai-dev-foundation` source and a full commit hash. All other CI, branch
protection, and human review remain mandatory. This is small and reversible, but a
compromised target workflow could create a large review burden.

### Option 4: Replace legacy sync before accepting the current foundation state

Wait for manifest materialization and import one parent commit at a time. This is the
long-term direction and gives finer provenance, but it does not make a large newly added
file small and delays the already reviewed security and governance improvements.

## Decision

Adopt Option 3. The PR-size job MUST enforce its existing hard limit unless every listed
identity, repository, branch, base, and provenance condition matches. A matching sync PR
MAY exceed the hard limit only as a declared mechanical foundation import. It MUST still
run every non-size CI check, receive human review, and merge through branch protection.
The exception MUST NOT auto-merge the PR or supply a privileged token.

## Consequences

**Positive:** authenticated foundation imports become reviewable and mergeable; ordinary
PR size enforcement is unchanged; no additional credential or workflow permission is
introduced; and all executable checks continue to run.

**Negative:** sync PRs can be cognitively expensive to review; bot identity and naming are
part of the control; and a compromised target-owned sync workflow could generate an
oversized PR, though it still could not merge without checks and human approval.

**Migration and rollback:** implement the predicate and its positive and negative tests
in a separate PR, then rerun PR #13. Rollback removes the predicate and returns to the
unconditional hard limit; no repository data or credential migration is involved.

**Follow-ups:** record acceptance in the decision log; document the mechanical exception
in the PR template or workflow comment; and replace the legacy path when manifest
materialization can provide equivalent provenance and smaller incremental reviews.
