---
"@expressthat-auth/infrastructure-conformance": minor
"@expressthat-auth/quality": minor
---

Add reusable, fail-closed infrastructure adapter conformance harnesses.

- Define capability-specific suites for cache, queue, object storage,
  observability, secret storage, and key management.
- Enforce all applicable success, failure, timeout, retry, concurrency,
  redaction, runtime, health, and residency probes.
- Run deterministic adapters through the shared suites using their public
  contracts.
- Classify the package as test-only conformance infrastructure in repository
  ownership and dependency-boundary policy.
