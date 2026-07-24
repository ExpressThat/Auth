---
task: RUN-001
category: added
audiences: developers, operators
surfaces: configuration, docker, runtime
breaking: false
migration: none
security: fail-closed-redacted-startup-configuration
---

Added the runtime-neutral validated configuration package with separately typed
public, secret, build-time, and runtime-binding sections, fail-closed startup
validation, redacted errors, and non-serializing secret and binding accessors.
