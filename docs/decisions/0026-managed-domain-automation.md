# ADR-0026: Separate Managed-Domain Automation Lifecycles

- **Status:** Accepted
- **Date:** 2026-07-24
- **Owners:** Runtime, security, platform, and operations engineering
- **Related tasks:** RUN-019, DOM-005 through DOM-012, OPS-010
- **Supersedes:** None
- **Superseded by:** None

## Context

Hosted custom domains cross three infrastructure authorities: DNS ownership and
routing, certificate custody and issuance, and immutable frontend deployment.
Embedding any provider API in the domain model would couple authentication
state to one operator, make self-hosting replacement unsafe, and blur which
proof authorizes the next lifecycle.

These operations are asynchronous, retryable, and vulnerable to stale writes,
cross-tenant reference substitution, dangling DNS, certificate mismatch,
artifact substitution, and secret leakage.

## Decision

Define independent DNS, certificate, and frontend-deployment runtime ports.
Each request carries a validated customer-organisation, environment, and
application scope. Provider references are opaque and redacting. Every mutation
after creation requires an optimistic revision.

The authorization chain is explicit:

1. DNS preparation binds a normalized hostname, ownership challenge, expiry,
   challenge record, and expected routing target.
2. Certificate issuance retains the DNS verification reference that authorized
   it. Renewal and revocation preserve the same binding.
3. Frontend deployment retains the certificate reference and an immutable
   artifact reference plus SHA-256 digest.
4. Activation verification fails until the adapter reports an active,
   revision-matched deployment.

Artifact references use a bounded namespaced opaque format and cannot be HTTP
URLs. Provider health and normalized errors expose no vendor diagnostics.
Operator composition validates all three capabilities before serving traffic.

## Alternatives Considered

### One Managed-Domain Provider

Rejected. It combines DNS, private-key, artifact, and deployment authority,
prevents independent replacement, and increases incident blast radius.

### Hosted Control-Plane Calls in Domain Services

Rejected. It would make the core product depend on one hosted operator and
allow provider-specific behavior to bypass runtime manifests and conformance.

### Raw URLs and Provider Identifiers

Rejected. Raw artifact URLs create SSRF and expiring-credential risks; exposed
provider identifiers encourage persistence and branching on vendor details.

## Security Impact

Tenant scope is checked on every lookup and mutation. Opaque references redact
from JSON, challenges redact from diagnostics, and normalized errors contain
only operation, stable code, and retryability. Revisions reject stale
automation callbacks. DNS proof, certificate, and artifact integrity remain
linked across the lifecycle, preventing a valid object from being substituted
into a different authorization chain.

The contracts do not make a domain active. Host routing must still follow
ADR-0008: re-resolve DNS, validate TLS and HTTP reachability, probe issuer
metadata and security headers, then atomically activate an audited domain.

## Privacy and Residency Impact

Hostnames and infrastructure references may be customer data. Adapter
qualification must document transfers, retention, subprocessors, and residency.
Hosted bindings must satisfy the applicable European policy. Self-hosted
operators select their own services and regions and own their compliance.

## Portability and Self-Hosting Impact

Hosted and self-hosted Docker compositions use the same contracts and operator
selection. Implementations remain separate `dns-*`, `certificate-*`, and
`deployment-*` packages under ADR-0025. Deterministic in-memory adapters are
test-only and cannot be selected for interactive or production profiles.

## Operational Impact

Adapters must make retries safe, report health, preserve reference/revision
history, and support reconciliation after partial failure. Domain workflows
store durable lifecycle state outside application processes. Rollback creates a
new revision from a prior active artifact rather than moving a mutable pointer
without history.

## Consequences

- Domain services request capabilities without naming infrastructure vendors.
- DNS, certificate, and deployment incidents can be isolated independently.
- Implementations must pass category-specific conformance before registration.
- Later domain orchestration owns durable state transitions and compensation.
- Live provider validation remains adapter-specific and credential-gated.

## Validation

- Runtime contract and deterministic lifecycle tests maintain complete
  statement, branch, function, and line coverage.
- Shared conformance runs success, failure, timeout, retry, concurrency,
  redaction, runtime, health, and tenant-isolation/residency probes.
- Compile-time tests reject raw hostnames, revisions, digests, and tenant IDs.
- Composition tests reject missing methods and unvalidated manifest bindings.

## Review Triggers

- Wildcard or multi-SAN certificates are introduced.
- Operators need certificate import or external account binding.
- Deployment artifacts require streaming rather than immutable references.
- A provider cannot preserve revision or tenant isolation semantics.
- Managed domains become available outside the hosted edition.

## References

- [ADR-0008](0008-browser-cookie-domain-topology.md)
- [ADR-0017](0017-european-data-residency.md)
- [ADR-0025](0025-infrastructure-adapter-packaging.md)
