# Data Access

Status: planned package shell.

Owns database-neutral repository, transaction, unit-of-work, concurrency, and
migration semantics. Product logic depends on these contracts rather than a
Drizzle dialect implementation.

See [ADR-0022](../../docs/decisions/0022-pluggable-database-adapters.md) for the
SQLite, PostgreSQL, conformance, and future-adapter rules.
