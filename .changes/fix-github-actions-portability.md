---
"@expressthat-auth/quality": patch
---

Make GitHub Actions and repository-policy tests deterministic on Linux.

- Accept the conventional command separator forwarded by pnpm to the SARIF
  policy entry point.
- Build path expectations with the host path implementation.
- Isolate generated Biome fixtures under an existing tracked source directory.
- Run affected static work before coverage and avoid duplicate uninstrumented
  test execution in clean CI.
- Serialize instrumented workspace suites so memory-hard cryptography is not
  starved by unrelated coverage processes on shared runners.
