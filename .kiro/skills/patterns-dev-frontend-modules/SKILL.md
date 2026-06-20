---
name: patterns-dev-frontend-modules
description: Use when a React or Next.js feature folder is getting crowded, mixes UI with hooks and helpers, or needs a clearer public module boundary and internal structure.
---

# Patterns.dev Frontend Modules

## Overview

Use this skill to reorganize frontend features into smaller modules with a clean public API. It applies patterns.dev-inspired boundaries: split presentation from orchestration, isolate hooks from pure utilities, and keep the feature root as a narrow export surface instead of a dumping ground.

## When to Use

- A feature folder has too many flat files
- Presentational components, hooks, helpers, and tests are mixed together
- Consumers import deep internals inconsistently
- One component is carrying orchestration, side effects, and UI rendering together
- A feature needs a reusable shape for future growth

## Core Pattern

Prefer this structure for medium-to-large frontend features:

```text
feature/
  components/
  hooks/
  lib/
  __tests__/
  index.ts
```

- `components/`: render-focused UI
- `hooks/`: stateful orchestration and side effects
- `lib/`: pure helpers, formatters, adapters
- `__tests__/`: focused tests for public and internal units
- `index.ts`: public surface only

## Rules

- Keep the root barrel small and intentional; export only what outside consumers should use.
- Let internal modules import each other directly instead of routing every import through the barrel.
- Move stateful composition into hooks when a component starts owning upload, recording, subscription, or keyboard logic.
- Group related UI by role, not by suffix alone. Example: `components/composer`, `components/media`, `components/messages`.
- Keep pure helpers out of components so they stay testable and reusable.
- Avoid creating a `utils/` catch-all when `lib/` can stay narrow and feature-specific.

## Reference Notes

Read [references/patterns-dev-notes.md](references/patterns-dev-notes.md) before major restructures. It captures the patterns.dev ideas this skill is based on and how to translate them into feature folder boundaries.
