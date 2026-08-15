---
name: Imported workspace entrypoints
description: Mixed JavaScript/TypeScript repositories can carry stale scaffold entrypoints alongside the real runtime entry.
---

When importing a workspace from an existing repository, verify the actual bundler entry before running package checks; remove or exclude stale duplicate entrypoints that are not part of the runtime.

**Why:** A repository can run correctly through its configured JavaScript entry while an unused scaffold TypeScript entry still fails the workspace typecheck.

**How to apply:** Check `index.html`, the Vite config, and package scripts first. Keep the runtime entry authoritative and avoid maintaining duplicate app boot paths.