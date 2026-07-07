---
id: src-layout
title: Source Layout
---

# src/ — Source Layout

Binding rules: [.ai/architecture.md](../.ai/architecture.md) (ARC-001..004). Summary:

```
src/
  modules/<context>/     # one bounded context per directory
    MODULE.md            # module contract — mandatory, template below
    domain/              # pure business logic; imports nothing external
    application/         # use cases; defines ports (interfaces)
    infrastructure/      # adapters implementing ports (DB, APIs, queues)
    interface/           # inbound edges (HTTP, CLI, consumers)
  shared/                # domain-free primitives used by 3+ modules (ARC-004)
tests/                   # mirrors this tree exactly (TST-001)
```

Dependency direction: `interface → application → domain` and
`infrastructure → application → domain`. Never sideways into another module's
internals — cross-module calls use the target's MODULE.md public API or events.

## Worked example

The reference module for this template is `modules/identity/` (Clerk webhook sync +
authorization), landing with the SaaS foundation. **Imitate its shape** (COD-050). The
base template's language-agnostic worked example lives upstream:
[ai-dev-foundation `src/modules/catalog/`](https://github.com/Yukihide-Mitsuoka/ai-dev-foundation/tree/main/src/modules/catalog).

This template adds one layout rule on top of ARC-001: `src/app/` (Next.js App Router) is
a **thin routing shell** — pages and route files delegate to `modules/*/interface` and
contain no business logic.

## MODULE.md template

Copy this when creating a module; keep it under one page.

```markdown
---
id: module-<context>
title: <Context> Module
updated: YYYY-MM-DD
---

# <Context> Module

Purpose: <2-3 sentences: what business capability this module owns, and what it
explicitly does NOT own>

## Public API (the contract — everything else in this module is private)
| Entry point | Layer | Description |
|-------------|-------|-------------|
| <UseCase/Function> | application | ... |

## Events
| Direction | Event | Schema | Notes |
|-----------|-------|--------|-------|
| publishes / consumes | ... | link | ... |

## Owned data
<tables/collections this module exclusively reads & writes — no other module touches them>

## Invariants (MUST always hold — each maps to a test)
1. ...

## Dependencies
| Uses module | Via | Why |
|-------------|-----|-----|
```
