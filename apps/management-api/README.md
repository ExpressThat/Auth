# Management API

Status: planned application shell.

Owns customer-organisation, application, environment, user, policy, provider,
domain, audit, and privacy management routes. Hono route schemas are the source
for typed clients and generated OpenAPI 3.1 documentation.

It cannot weaken the separate management-identity trust plane or accept
caller-selected tenant scope. See the
[workspace register](../../docs/architecture/workspace-ownership.md).
