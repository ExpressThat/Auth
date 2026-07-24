# PostgreSQL Database Adapter

Status: planned package shell.

Owns the Drizzle PostgreSQL schema, migrations, and repository implementation.
It implements `@expressthat-auth/data-access` and passes the shared database
conformance suite without leaking dialect types into product logic.

PostgreSQL is intended for hosted and optional self-hosted deployments, not the
required ordinary local-development path. See
[ADR-0022](../../docs/decisions/0022-pluggable-database-adapters.md).
