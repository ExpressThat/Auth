# ADR-0017: Qualify Every Hosted Data Path for EU Residency

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Privacy, security, platform, and operations engineering
- **Related tasks:** DEC-018, GOV-001 through GOV-019, OPS-001 through OPS-026
- **Supersedes:** None
- **Superseded by:** None

## Context

Serving an API from a European runtime does not prove that database proxies,
subrequests, queues, scheduled consumers, caches, objects, logs, backups, keys,
support, or providers remain in Europe. Provider products expose different and
changing controls, and remote third-country access can be a transfer even when
storage remains European.

## Decision

Adopt [the European residency and transfer map](../privacy/european-data-residency.md)
as the binding hosted baseline.

Platform-controlled processing and persistence of all non-public data occurs in
the EU, including disaster recovery, logs, jobs, objects, keys, and routine
support. Public data can be globally distributed for its intended purpose.

Every adapter and deployment resource declares storage, processing, backup,
support, failover, key, and onward-transfer jurisdictions plus evidence and
expiry. Composition fails closed when a non-public path is global, unknown,
best-effort, unsupported, or conflicts with policy.

For the Workers profile, configure EU Regional Services, EU Customer Metadata
Boundary, approved EU TLS-key custody, EU PostgreSQL, and EU object/log paths
separately. Regional Services is not treated as covering subrequests or bindings.
Cloud services without an explicit current EU guarantee remain disabled for
non-public workloads; the portable EU Docker/service adapter is used instead.

Self-hosters select their own regions and may intentionally operate outside
Europe. The optional EU profile can validate and report declared technical
capabilities, but cannot claim residency or GDPR compliance for an arbitrary
installation. An unrestricted/custom profile is labelled operator-managed and
not EU-verified; it cannot masquerade as having inherited hosted compliance.

## Alternatives Considered

### Trust the Location of the API Runtime

Rejected. It ignores every persistence, background, logging, key, provider, and
support path.

### Permit Best-Effort European Placement

Rejected for hosted non-public data. Location hints and nearest-region behavior
are not enforceable jurisdiction guarantees.

### Require Every Customer Provider to Be European

Rejected as an unconditional product rule. A customer may lawfully instruct a
disclosed/minimized external transfer, but it is not a platform default and must
pass controller policy and transfer assessment.

### Claim Residency for Self-Hosted Docker

Rejected. The operator controls its infrastructure, keys, vendors, backups, and
support access.

## Security Impact

Fail-closed capability qualification prevents a globally placed binding, log,
cache, queue, or failover from silently receiving credential or tenant data.
EU-only administration and key custody narrow high-privilege access paths.

## Privacy and Residency Impact

The data map covers storage, processing, remote access, onward transfer,
subprocessors, deletion, and evidence rather than database location alone.
Customer-directed transfers remain visible and purpose-limited.

## Portability and Self-Hosting Impact

Residency is expressed through adapter capabilities and deployment policy.
Workers can use compliant platform features where proven; Docker and external
EU services remain permanent alternatives. Self-hosters receive the same
validator without a false hosted guarantee. The validator is not legal advice,
certification, an SLA, or proof of undisclosed operator practice.

## Operational Impact

Provider facts, contracts, entitlements, regions, egress, support, and
subprocessors require recurring evidence and drift monitoring. Some convenient
Cloud services remain unavailable until they publish sufficient guarantees.

## Consequences

- A European edge does not implicitly approve any subrequest or binding.
- Hosted failover and disaster recovery remain inside the EU.
- Unsupported Cloudflare capabilities use portable EU adapters.
- Provider changes can disable a capability until requalified.
- Legal/privacy review remains necessary in addition to technical enforcement.

## Validation

- Trace every architecture data path to a row in the residency map.
- Test composition failure for unknown/global/best-effort adapter capabilities.
- Probe hosted origins and inspect every configured resource's jurisdiction.
- Exercise EU-only backup/restore, failover, support, deletion, and incident
  paths.
- Run egress canaries and provider/subprocessor drift checks on schedule.

## Review Triggers

- A provider product, plan, region, contract, subprocessor, or support path
  changes.
- A new adapter, data class, destination, runtime, backup, or failover path is
  introduced.
- GDPR transfer guidance, adequacy, or customer residency commitments change.
- Evidence expires or monitoring observes out-of-region behavior.
