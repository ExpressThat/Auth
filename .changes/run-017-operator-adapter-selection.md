---
"@expressthat-auth/config": minor
"@expressthat-auth/deploy-docker": minor
"@expressthat-auth/quality": minor
"@expressthat-auth/runtime": minor
---

Add fail-closed operator-controlled infrastructure adapter selection.

- Parse strict startup-only capability bindings for hosted, self-hosted, and
  local-development Docker profiles.
- Resolve only statically registered runtime manifests and reuse capability,
  runtime, state, and residency validation.
- Restrict operator control exports to configuration ownership and Docker
  composition so customer-facing applications cannot select infrastructure.
- Replace an ambient JWK global in the public runtime contract with an explicit
  portable public-key shape.
