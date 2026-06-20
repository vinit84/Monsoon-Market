# Patterns.dev Notes

Source:

- [patterns.dev](https://www.patterns.dev/)

Working summary used for this repo:

- Patterns are reusable solutions, not strict prescriptions. Use them to shape boundaries, not to force ceremony.
- The most relevant frontend patterns for folder structure here are:
  - module boundaries
  - hooks as orchestration containers
  - presentational/container separation
  - small public APIs with internal colocation

How that maps into this codebase:

- Use the feature folder as the module boundary.
- Put render-heavy files under `components/`.
- Put side-effect-heavy orchestration under `hooks/`.
- Keep pure helpers and adapter functions under `lib/`.
- Keep `index.ts` as the public API for consumers outside the feature.
- Let internal files use direct relative imports so the barrel does not become an accidental dependency hub.

Recommended smell checks:

- If a component owns both UI and several `useMutation` or browser API flows, extract a hook.
- If a folder has 10+ flat files with unrelated responsibilities, add subfolders by role.
- If helpers are imported from many UI files but have no JSX, move them to `lib/`.
- If consumers import deep paths inconsistently, define a stable barrel for the intended public surface.
