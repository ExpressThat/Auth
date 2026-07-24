# Auth API

Status: planned application shell.

Owns authentication, OAuth/OIDC, sessions, consent, account, and end-user HTTP
behavior. Routes are Hono contracts backed by runtime schemas and generated
OpenAPI 3.1 documentation, with tested Docker and multi-instance behavior.

It composes runtime-neutral packages and adapters; no other package imports this
application. See the [workspace register](../../docs/architecture/workspace-ownership.md)
and [API conventions](../../docs/decisions/0011-shared-api-conventions.md).
