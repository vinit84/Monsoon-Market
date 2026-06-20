---
name: system-design-101-boundaries
description: Use when a feature is growing beyond simple UI work and needs clearer boundaries between presentation, orchestration, I/O, real-time behavior, failure handling, and public APIs.
---

# System Design 101 Boundaries

## Overview

Use this skill when a feature needs structure that will hold up as behavior grows. It turns system-design concerns into frontend and feature-module boundaries: isolate side effects, keep public interfaces explicit, separate queries from commands, and make failure paths visible.

## When to Use

- A feature mixes rendering, network calls, browser APIs, and business rules together
- You need clearer separation between UI and data workflows
- A real-time or collaborative surface is getting harder to reason about
- Deletion, uploads, recording, retries, or optimistic updates are spread across multiple files
- You want a feature structure that can scale without turning into a single giant component

## Boundary Checklist

- Presentation: components that render and receive data/actions as props
- Orchestration: hooks that coordinate mutations, effects, subscriptions, and browser APIs
- Pure domain logic: helpers that transform data and format values
- Public API: a narrow barrel or entrypoint that defines what other modules can import
- Failure paths: explicit user-facing handling for upload, delete, download, and permission errors

## Rules

- Separate commands from queries whenever possible.
- Keep browser API integration in hooks or dedicated adapters, not scattered through UI components.
- Make destructive behavior predictable: delete, soft-delete, cleanup, and retry paths should be explicit.
- Design folders so future scaling pressure lands in the right place instead of bloating the main component.
- Prefer a few strong boundaries over many tiny layers.

## Reference Notes

Read [references/system-design-101-notes.md](references/system-design-101-notes.md) when deciding how to split responsibilities across files or layers.
