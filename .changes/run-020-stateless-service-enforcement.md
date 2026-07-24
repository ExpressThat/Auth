---
"@expressthat-auth/quality": minor
"@expressthat-auth/test-config": minor
---

Enforce horizontally safe stateless services.

- Reject mutable process state and local cache or lock packages in server and
  core authentication source.
- Add bounded two-replica conformance for sessions, nonces, locks, rate limits,
  job ownership, authorization, and tenant caches.
- Prove separate process backends fail every state category while a shared
  backend passes.
