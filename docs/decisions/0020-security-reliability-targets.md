# ADR-0020: Use Tiered SLOs and Security Response Targets

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, SRE, platform, and identity engineering
- **Related tasks:** DEC-021, OPS-012 through OPS-020, REL-004 through REL-009
- **Supersedes:** None
- **Superseded by:** None

## Context

"Fast", "available", "scalable", and "recoverable" cannot gate production.
Authentication also cannot trade security correctness for latency or
availability. Operations need explicit endpoint tiers, queue priorities,
recovery objectives, capacity/headroom, incident severity, and vulnerability
response targets.

## Decision

Adopt [the security and reliability targets](../operations/security-reliability-targets.md).

Core trust metadata targets 99.99% monthly availability; existing-access and
interactive identity operations target 99.95%; management and durable
asynchronous acceptance target 99.9%. Incorrect authorization, cross-tenant
data, stale security decisions, fail-open responses, or missing required audit
always count as failures and have no acceptable error budget.

Define measurable p50/p95/p99 request thresholds, initial hosted EU sustained and
burst capacity, at least 30% bottleneck headroom, queue start/hand-off targets by
security priority, EU-contained RPO/RTO by failure scope, and SEV-0 through
SEV-3 response/communication targets.

All Docker replicas must meet the same user-facing behavior and security
invariants. Hosted Docker capacity must meet the target
thresholds. Self-hosted releases publish measured reference topologies and
include load/failure tools rather than promising performance for unknown
hardware. Self-hosted operators set and prove their own uptime, availability,
capacity, backup, and RPO/RTO commitments.

Production beta gathers/exercises the indicators. General availability requires
representative evidence and no unowned critical/high security finding.

## Alternatives Considered

### One Availability Target for Every Endpoint

Rejected. Cached trust metadata, token access, management, and multi-hour export
jobs have different customer and operational behavior.

### Exclude Planned Maintenance and Dependencies

Rejected. Customers experience them as platform unavailability; architecture
must support rolling change and resilient dependencies.

### Optimize by Failing Open

Rejected. Security/privacy correctness has no error budget.

### Promise Self-Hosted Throughput Without a Topology

Rejected. Operators control hardware, network, database, adapters, and scale.
Published reproducible benchmarks are honest and actionable.

## Security Impact

Security revocation, emergency key actions, audit, and notifications receive
reserved highest queue priority. Overload and recovery cannot skip
authorization, audit, cryptography, tenant scope, or EU residency.

## Privacy and Residency Impact

Metrics avoid personal/high-cardinality labels. Backups, replicas, failover,
evidence, incident tooling, and disaster recovery remain within the EU.

## Portability and Self-Hosting Impact

Black-box SLIs and conformance are provider-neutral. Each adapter/runtime can
have different internal budgets but cannot deliver weaker externally observable
correctness or omit benchmark/failure evidence. Reference evidence is not an SLA
or guarantee for another self-hosted topology.

## Operational Impact

Multi-window burn alerts, capacity tests, reserved queue capacity, restore/
failover drills, incident exercises, and vulnerability deadlines require ongoing
staff and infrastructure. Error-budget exhaustion pauses risky delivery.

## Consequences

- General availability has objective performance and recovery gates.
- Planned work and selected dependencies count toward reliability.
- Initial capacity numbers must be increased as observed demand grows.
- Some long-running work is measured by durable acceptance and queue/job
  timeliness rather than HTTP completion.

## Validation

- Generate each SLI from synthetic and real redacted telemetry.
- Meet latency and capacity targets under mixed sustained/burst workload.
- Force every failure scope and verify RPO/RTO, safety, and communication.
- Run incident and vulnerability exercises against the response clock.
- Compare Docker replica results and publish self-hosted reference results.

## Review Triggers

- Any trigger in the target standard.
- A customer contract proposes a stricter SLA/SLO.
- Targets are routinely exceeded or missed and no longer guide decisions.
