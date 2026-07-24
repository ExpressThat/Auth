---
task: DEC-024
category: changed
audiences: developers, operators, self-hosters
surfaces: deployment, runtime, documentation, testing
breaking: true
migration: remove-platform-specific-deployment-configuration-and-use-docker
security: reduced-runtime-and-deployment-surface
---

Docker with Node.js is now the sole supported deployment method for hosted and
self-hosted editions. Direct execution, built-image, reverse-proxy, and
multi-replica tests replace the previous cross-runtime validation model.
