# Platform API

Status: planned restricted application shell.

Owns system-organisation, bootstrap, controlled support, deployment, and
operator-only routes. Its Hono contracts generate internal OpenAPI 3.1
documentation that must remain separated from customer-facing artifacts.

This API never provides a hidden support login or reusable bypass. See the
[bootstrap](../../docs/security/bootstrap-and-break-glass.md) and
[support-access](../../docs/security/support-and-impersonation.md) standards.
