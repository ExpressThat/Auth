# ADR-0015: Maintain an Asset and Trust-Boundary Threat Model

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security engineering and all feature owners
- **Related tasks:** DEC-016, FND-021, SEC-030 through SEC-032
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform combines identity protocols, high-value credentials, multi-tenant
data, support access, provider calls, durable jobs, and two permanent runtime
targets. A security checklist at release time cannot expose all confused-deputy,
state-machine, concurrency, privacy, provider, and operational failures.

## Decision

Adopt [the platform threat model](../security/threat-model.md) as a living,
versioned engineering artifact. It defines:

- assets, actors, trust boundaries, and baseline invariants;
- authentication, protocol, tenancy, privacy, provider, job, operations,
  browser, and runtime threats;
- inherent severity, required controls/evidence, and residual risks;
- required hostile journeys and validation layers; and
- change triggers, review cadence, finding ownership, and release policy.

Every implementation task performs a security-impact check under the backlog's
continuous defensive security rule. Feature owners update affected threat/control
entries and tests in the same commit. Security engineering owns consistency and
risk policy but does not become the only team responsible for secure code.

Critical and high findings block production release until remediated and
verified. Any temporary exception requires explicit security and accountable
business ownership, narrow affected scope, compensating controls, expiry, and
monitoring; it cannot be hidden in a scanner configuration.

The initial model explicitly covers authentication, tenancy, providers, support
access, asynchronous work, Workers, Docker, shared databases, adapter
infrastructure, data ownership, GDPR workflows, and European residency.

## Alternatives Considered

### Threat Model Only Before General Availability

Rejected because architectural assumptions and abuse paths change during
implementation, and late findings are harder to remove safely.

### Security-Team-Owned Checklist

Rejected because feature engineers make the daily boundary, parser, state,
authorization, and failure decisions.

### Scanner Findings as the Threat Model

Rejected. Automated tools cannot understand tenant authority, protocol purpose,
consent, impersonation, controller obligations, or distributed state machines.

## Security Impact

Threats become traceable to implemented controls and negative tests. Continuous
review reduces silent drift, while explicit residual risk avoids implying that
coverage or conformance proves absence of vulnerabilities.

## Privacy and Residency Impact

Privacy harms, data-subject workflows, exports, support access, subprocessors,
logs, jobs, backups, and European processing are first-class threats rather than
compliance notes outside engineering.

## Portability and Self-Hosting Impact

The model treats Workers and Docker as equal targets and distinguishes product
controls from risks transferred to a self-hosted root operator. Adapter
conformance and deployment-profile evidence prevent hosted-only assumptions.

## Operational Impact

Reviews, findings, suppressions, exercises, and evidence need owners and bounded
retention. Quarterly and release reviews consume engineering time, and incident
learning creates new backlog work.

## Consequences

- Security analysis occurs with each feature rather than only at release.
- Every high-impact trust boundary has hostile tests and operational evidence.
- Accepted residual risks are visible, owned, and time bounded.
- The model must evolve whenever architecture or real-world threats change.

## Validation

- Map every current architecture component and planned feature group to at least
  one asset and trust boundary.
- Confirm the register includes authentication, tenancy, providers, support,
  jobs, Workers, Docker, privacy, and residency.
- Trace critical/high threats to backlog tasks or existing ADR controls.
- Exercise the maintenance workflow on the next feature and security incident
  simulation.

## Review Triggers

- Any trigger listed in the living threat model.
- A security incident or external assessment finding.
- A new runtime, database, provider category, protocol, or privileged role.
- A material architecture, data-purpose, residency, or support-policy change.

