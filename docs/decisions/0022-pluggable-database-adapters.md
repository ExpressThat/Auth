# ADR-0022: Keep Database Selection Behind Conforming Adapters

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Data and runtime engineering
- **Related tasks:** DEC-023, DB-001 through DB-026, RUN-017, OPS-003
- **Supersedes:** None
- **Superseded by:** None

## Context

The hosted service and self-hosted distribution must not be permanently tied to
one database. Drizzle reduces SQL driver coupling, but different engines still
have distinct schemas, migrations, transactions, locking, and operational
capabilities. Claiming that Drizzle makes every database interchangeable would
hide those differences and create unsafe production deployments.

## Decision

Domain and API packages depend on database-neutral repository contracts.
Deployment composition selects a registered database adapter through validated
operator configuration.

SQLite and PostgreSQL are the initial first-party implementations. SQLite is the
default local-development database. PostgreSQL is the initial shared-production
reference, not a permanent hosted or self-hosted requirement.

Every additional first-party, community, or private adapter must supply:

- repository implementations and transaction semantics;
- versioned schemas and forward migrations;
- declared runtime, consistency, concurrency, and feature capabilities;
- health and readiness checks;
- backup, restore, and upgrade guidance; and
- the shared isolation, failure, migration, and repository conformance suite.

First-party SQL adapters use Drizzle where it supports the selected engine.
Non-SQL engines, or SQL engines without a suitable Drizzle implementation, may
use an independent adapter without changing domain or HTTP contracts.

## Alternatives Considered

### Require PostgreSQL Everywhere

Rejected. It would simplify the first deployment but contradict the portability
and self-hosting goals.

### Assume Every Drizzle Driver Is Automatically Supported

Rejected. A driver does not prove equivalent constraints, migrations,
transactions, isolation, backup behavior, or runtime compatibility.

### Let Operators Replace Repositories Ad Hoc

Rejected. Unregistered implementations would bypass capability checks,
conformance evidence, and upgrade ownership.

## Security Impact

Adapters must preserve tenant predicates, uniqueness, atomic security-state
transitions, least-privilege credentials, parameterized queries, and auditable
migrations. Conformance includes cross-tenant denial and adverse concurrency.

## Privacy and Residency Impact

Hosted database adapters and locations remain subject to the European residency
and processor qualification policy. Self-hosters choose and operate their own
database, location, retention, backup, and deletion controls.

## Portability and Self-Hosting Impact

Hosted and self-hosted distributions use the same adapter contract. Operators
can select any supported adapter, and can implement a private adapter without a
domain or API fork. Support begins only after its declared capabilities and
conformance suite pass.

## Operational Impact

Each supported adapter carries migration, recovery, monitoring, and upgrade
work. Horizontally scaled production profiles must select an adapter that
provides shared durable state and the required concurrency semantics.

## Consequences

- Database selection occurs at the composition root.
- Core packages cannot import a database driver or dialect-specific schema.
- Support is claimed per adapter and runtime, not for every database in the
  abstract.
- Removing an adapter must include data migration and compatibility guidance.

## Validation

- Run the shared repository and migration suites against every supported
  adapter.
- Verify tenant isolation, concurrent security transitions, rollback behavior,
  health checks, and capability negotiation.
- Prove hosted and Docker composition can switch registered adapters without
  changing domain or HTTP packages.

## Review Triggers

- A new database or runtime is proposed.
- Drizzle changes support or migration behavior for a selected dialect.
- Horizontal-scaling, consistency, backup, restore, or residency requirements
  change.
