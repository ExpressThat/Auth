---
task: RUN-006
category: added
audiences: developers, operators
surfaces: runtime, cache, rate-limits
breaking: false
migration: none
security: tenant-scoped-expiring-shared-state
---

Added tenant-scoped cache keys, redacting byte values, expiry, versioned
compare-and-set and deletion, atomic counters, provider health, normalized
errors, and explicit fail-closed or authoritative-source outage policies.
