# System Design 101 Notes

Source:

- [ByteByteGoHq/system-design-101](https://github.com/ByteByteGoHq/system-design-101)

Working summary used for this repo:

The repository spans topics such as:

- web development
- API design
- real-time systems
- queues and messaging
- caching
- scaling
- observability
- security

How that maps into feature structure work:

- Treat the feature root as a service boundary with a defined public API.
- Keep transport and side-effect concerns localized so UI files do not become the system boundary by accident.
- Separate read paths from write paths when possible.
- Make cleanup and failure behavior first-class in modules that touch uploads, recording, downloads, or destructive actions.
- Use structure to reflect operational concerns: public entrypoints, orchestration hooks, pure helpers, and UI leaves.

This is an inference from the repository's topic coverage rather than a direct copy of any single article. The goal is to bring system-design thinking to module boundaries inside the app.
