# ADR-0024: Support Shared and Per-Organisation Database Placement

- **Status:** Accepted
- **Date:** 2026-07-24
- **Owners:** Data, security, platform, and operations engineering
- **Related tasks:** DEC-025, DB-027 through DB-031, OPS-029
- **Supersedes:** None
- **Superseded by:** None

## Context

Small installations need one supported database with strong logical tenant
isolation. Larger and regulated installations may require the data belonging to
each top-level customer organisation to live in a separate database for
stronger blast-radius, access, backup, residency, and lifecycle separation.

Database placement must not fork domain or API behavior, trust a caller-supplied
database name, require process-local routing state, or imply that Drizzle alone
makes database engines interchangeable.

## Decision

Support three operator-selected placement profiles behind the database-adapter
and repository contracts:

1. **Shared:** the control plane and every customer organisation use one
   database, with mandatory organisation and environment predicates,
   constraints, and conformance tests.
2. **Dedicated:** a control database stores platform authority and the durable
   placement registry; every top-level customer organisation receives a
   separate organisation database.
3. **Hybrid:** selected organisations receive dedicated databases while other
   organisations use one or more shared placements. This is required for safe
   gradual migration between the first two profiles.

Placement applies to top-level customer organisations, not end-user
organisations. The protected system organisation, installation state,
management identities, customer-organisation registry, administrator
memberships, placement records, and placement-operation state remain in the
control database. Environment-owned customer data, users, applications,
credentials, sessions, consent, providers, audit, outbox, and jobs reside in
the selected organisation placement.

Every placement selects a registered database adapter and immutable connection
reference through operator configuration. The control database maps a trusted
customer-organisation identifier to a placement ID and revision. Requests and
jobs first resolve authenticated tenant context, then use that durable mapping.
Headers, client input, hostnames, unverified token claims, and resource IDs
cannot select a connection string or database.

Routing metadata may be request-scoped or held in a distributed versioned
cache. Process-local routing data is never authoritative across requests.
Connection pools are bounded process resources, not tenant-state caches; fleet
limits, eviction, backpressure, and readiness prevent a large dedicated fleet
from exhausting connections.

Organisation creation and placement changes use explicit durable state
machines. Provisioning, migration, verification, activation, failure, rollback,
and decommissioning are idempotent and auditable. There are no distributed
transactions between the control database and an organisation database.
Cross-database work uses transactional outboxes, idempotency, reconciliation,
and fail-closed activation.

Moving an organisation prepares and migrates the target, copies and verifies
data and counts, applies a bounded write transition, atomically changes the
control-plane placement revision, and retains a time-bounded rollback plan.
Every request and durable job detects stale placement revisions and resolves
the current authoritative destination before mutation. A source is destroyed
only after verification, rollback expiry, retention, backup, and deletion
requirements are satisfied.

All active organisation databases run a compatible logical schema. Migration
tooling inventories the fleet, applies expand-and-contract migrations with
bounded concurrency, records per-placement progress, resumes safely, and blocks
application readiness for incompatible placements. Backup, restore, export,
erasure, residency evidence, health, and disaster recovery operate per
placement as well as for the control database.

## Alternatives Considered

### Require One Shared Database

Rejected. It is efficient and remains fully supported, but cannot satisfy every
customer's desired physical isolation or independent backup and recovery model.

### Put Every Organisation in Its Own Database Without a Control Database

Rejected. Authentication and management identities can span organisations, and
the service needs one trusted authority for organisation existence, membership,
placement, schema compatibility, and routing.

### Let the Request Name Its Database

Rejected. It creates a tenant-routing injection boundary and confused-deputy
risk. Placement is resolved only from trusted tenant context and operator-owned
control data.

### Use Cross-Database Transactions

Rejected. They are not portable across supported adapters and complicate
failure recovery. Durable workflows and reconciliation make partial progress
explicit.

## Security Impact

Dedicated placement reduces some cross-tenant blast radius but does not replace
tenant predicates, authorization, encryption, least privilege, or application
isolation. Each placement receives distinct credentials. Routing confusion,
stale revisions, wrong-database access, pool exhaustion, provisioning races,
backup mix-ups, and migration rollback are mandatory adversarial tests.

## Privacy and Residency Impact

Dedicated placement enables organisation-specific backup, restore, deletion,
and declared residency. Hosted placements and every copy remain inside the
approved European policy. Self-hosted operators choose their own topology,
database vendors, locations, access, backups, and compliance posture; the
software makes no residency or availability guarantee for those choices.

## Portability and Self-Hosting Impact

Shared, dedicated, and hybrid profiles use the same domain and HTTP contracts.
Each control or organisation placement can use only a registered adapter whose
schema, migration, transaction, health, backup, and repository suites pass.
SQLite remains suitable for local or supported single-instance profiles; a
multi-replica topology requires adapters and infrastructure with shared durable
state and the required concurrency semantics.

## Operational Impact

Per-organisation databases materially increase credentials, pools, migrations,
monitoring, backups, restore drills, capacity planning, and incident work.
Operators configure placement limits and admission policy. Product plans may
control access to managed dedicated placement, but authorization and data
isolation never depend on billing state.

## Validation

- Run the complete repository suite in shared, dedicated, and hybrid profiles
  with multiple organisations and environments.
- Prove a tenant cannot influence routing or access another placement through
  identifiers, jobs, stale revisions, races, retries, or hostile input.
- Exercise organisation provisioning, partial failure, retry, migration,
  revision cutover, rollback, decommissioning, and interrupted fleet upgrades.
- Test bounded connection usage, backpressure, multi-replica routing, readiness,
  backup/restore, export, erasure, and disaster recovery for both topology
  styles.
- Verify hosted placement data, replicas, backups, logs, keys, and support paths
  remain within the European policy.

## Review Triggers

- A new database adapter, routing tier, sharding model, or geographic placement
  policy is introduced.
- Cross-organisation queries or transactions are proposed.
- Placement migration cannot provide a bounded write transition.
- Fleet size changes connection, migration, readiness, backup, or recovery
  assumptions.
