---
task: RUN-015
category: added
audiences: developers, maintainers
surfaces: architecture, ci, runtime
breaking: false
migration: add-neutral-build-task-for-new-core-source
security: deployment-import-boundary
---

Added import and build-graph enforcement proving core workspaces remain
runtime-neutral and compile without application or deployment entry points.
