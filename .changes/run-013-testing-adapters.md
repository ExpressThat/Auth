---
task: RUN-013
category: added
audiences: developers, test-engineering, security
surfaces: runtime-testing, adapters
breaking: false
migration: import-testing-adapters-from-runtime-testing
security: test-only-profile-enforcement
---

Promoted deterministic in-memory contract adapters to the testing-only runtime
subpath and added a manifest that cannot validate for interactive or production
deployment profiles.
