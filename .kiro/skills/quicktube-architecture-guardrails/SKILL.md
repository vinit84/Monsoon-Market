---
name: quicktube-architecture-guardrails
description: Enforces Quicktube architecture and readability guardrails for any feature, bugfix, or refactor. Use when changing Next.js routes, React components, Convex functions, Zustand stores, auth flows, or shared modules in this repo.
---

# Quicktube Architecture Guardrails

Read [docs/ENGINEERING_GUARDRAILS.md](../../../docs/ENGINEERING_GUARDRAILS.md) before making non-trivial code changes.

## Use this skill for

- feature implementation
- bug fixes
- refactors
- route/auth/workflow changes
- module boundary decisions

## Workflow

1. State the user or system problem first.
2. Name the owning boundary before editing code.
3. For non-trivial changes, write a 3-5 bullet plan covering:
   - problem
   - owning boundary
   - source of truth
   - verification
4. Keep `src/app/**` files thin and push workflow logic into feature modules or Convex.
5. Prefer one cohesive module over scattered helpers.
6. Avoid nested ternaries, duplicated state, and hidden business rules in hooks or UI.
7. Verify behavior with targeted tests and focused checks.

## Escalate before coding if

- the change adds another source of truth
- the same domain rule would exist on both client and server
- a page or layout is about to own feature workflow logic
- you are adding helpers because the real boundary is unclear

## Default standard

Readability beats cleverness. Explicit branches, early returns, stable boundaries, and smaller public interfaces are the default.
