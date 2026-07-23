# Architecture Decision Records

Architecture Decision Records (ADRs) capture choices that materially affect the
platform's security, portability, operability, or public contracts.

## Status Values

- **Proposed** — under evaluation and not yet binding.
- **Accepted** — the current implementation direction.
- **Superseded** — replaced by a later ADR.
- **Rejected** — considered but deliberately not selected.

## Index

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-package-manager.md) | Use pnpm for workspace and dependency management | Accepted |
| [0002](0002-supported-runtimes.md) | Support Node LTS, Workers, and modern browsers | Accepted |
| [0003](0003-test-toolchain.md) | Use Vitest and Playwright across test layers | Accepted |
| [0004](0004-hono-contracts.md) | Define Hono routes with Zod-backed OpenAPI contracts | Accepted |
| [0005](0005-oauth-oidc-building-blocks.md) | Build the issuer on portable reviewed protocol primitives | Accepted |
| [0006](0006-password-hashing.md) | Use versioned Argon2id behind portable hashing adapters | Accepted |
| [0007](0007-signing-key-custody.md) | Separate signing-key lifecycle from custody providers | Accepted |
| [0008](0008-browser-cookie-domain-topology.md) | Use host-only sessions on plane-specific first-party origins | Accepted |
| [0009](0009-identifiers-and-time.md) | Use UUIDv7 identifiers and UTC epoch-millisecond instants | Accepted |
| [0010](0010-api-versioning.md) | Version HTTP APIs by major path and immutable OpenAPI release | Accepted |
| [0011](0011-shared-api-conventions.md) | Standardize JSON, problems, cursors, concurrency, and retries | Accepted |
| [0012](0012-trusted-tenant-context.md) | Resolve and cross-check every tenant context before data access | Accepted |
| [0013](0013-management-identity-storage.md) | Store management and end-user identities in separate table families | Accepted |
| [0014](0014-environment-isolation.md) | Isolate users, credentials, keys, providers, and data by environment | Accepted |
| [0015](0015-platform-threat-model.md) | Maintain an asset and trust-boundary threat model | Accepted |
| [0016](0016-data-classification.md) | Classify and describe every boundary field | Accepted |
| [0017](0017-european-data-residency.md) | Qualify every hosted data path for EU residency | Accepted |
| [0018](0018-bootstrap-break-glass.md) | Use one-time bootstrap and quorum break glass | Accepted |
| [0019](0019-support-impersonation.md) | Prefer read-only support and constrain impersonation | Accepted |
| [0020](0020-security-reliability-targets.md) | Use tiered SLOs and security response targets | Accepted |
| [0021](0021-standards-register.md) | Pin and own protocol and security standards | Accepted |
| [0022](0022-pluggable-database-adapters.md) | Keep database selection behind conforming adapters | Accepted |
| [Template](TEMPLATE.md) | Standard ADR structure | Reference |

## Numbering

Use four-digit, monotonically increasing identifiers:

```text
0001-short-decision-name.md
0002-next-decision.md
```

Never reuse the identifier of a deleted or superseded decision. Add new ADRs to
the index in numeric order and link superseding records in both directions.

ADR numbers are not the same identifier as backlog `DEC-*` tasks. `DEC-001`
created this template and index without creating a decision record, so
`DEC-002` produced `ADR-0001`, `DEC-022` produced `ADR-0021`, and `DEC-023`
produced `ADR-0022`. Each ADR's
`Related tasks` field is the authoritative mapping.

## Lifecycle

1. Copy the template and record the context before implementation.
2. Compare realistic alternatives, including operational consequences.
3. Record security, privacy, residency, and self-hosting effects.
4. Mark the decision accepted before dependent backlog tasks are completed.
5. Revisit the ADR when a listed review trigger occurs.
