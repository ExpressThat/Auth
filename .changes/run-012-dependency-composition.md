---
task: RUN-012
category: added
audiences: developers, security
surfaces: runtime, composition, adapters
breaking: false
migration: none
security: validated-explicit-dependency-composition
---

Added runtime-neutral dependency composition that binds explicit provider
interfaces to the exact validated capability manifests before application
startup.
