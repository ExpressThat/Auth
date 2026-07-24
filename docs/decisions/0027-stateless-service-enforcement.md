# ADR-0027: Enforce Stateless Service Instances

- **Status:** Accepted
- **Date:** 2026-07-24
- **Owners:** Runtime, security, identity, and platform engineering
- **Related tasks:** RUN-020, API-018, AUTH-029, OIDC-025, OPS-014
- **Supersedes:** None
- **Superseded by:** None

## Context

Every API and job service must be horizontally scalable and interchangeable.
A login session, nonce, lock, rate counter, job lease, authorization decision,
or tenant cache held only in one Node process creates inconsistent security
behavior when a request reaches another Docker replica or an instance restarts.

Code review alone does not reliably detect singleton maps, memoizers, local
mutexes, or service fields that accidentally become authoritative. Static
analysis alone cannot prove that an injected repository or adapter is genuinely
shared and atomic.

## Decision

Use two complementary mandatory controls.

The repository boundary gate inspects production source for APIs, jobs, domain,
authorization, and protocol packages. It rejects:

- module-scope `let` and `var`;
- module-scope mutable array, object, `Map`, `Set`, `WeakMap`, or `WeakSet`
  values;
- service fields initialized with mutable collections;
- sensitive session, token, nonce, lock, authorization, cache, rate-limit,
  revocation, recovery, consent, tenant, or job stores constructed in process;
  and
- known in-process cache, memoization, mutex, semaphore, and lock packages.

Immutable module metadata must use explicit frozen construction. Request-local
memoization inside a handler is allowed. Infrastructure implementations and
runtime contract packages may own bounded connection pools, SDK clients, or
test-only deterministic stores; they are governed by adapter manifests,
composition, and conformance rather than this service-source rule.

`@expressthat-auth/test-config/adversarial` also exposes a bounded
`ReplicaStateConformanceSuite`. A feature supplies public-behavior probes for
authorization, job ownership, locks, nonces, rate limits, sessions, and tenant
caches. Each probe receives distinct primary and secondary replica identities.
Missing or malformed probes fail definition; false, thrown, or timed-out probes
produce normalized diagnostics without implementation details.

Static and deterministic harness evidence is necessary but not sufficient.
Every implemented stateful feature must run the same invariant through two
independently composed services and later against built Docker replicas.

## Alternatives Considered

### Ban Every In-Memory Value

Rejected. Request-scoped memoization, immutable metadata, connection pools, and
provider clients are valid process resources when they do not decide
cross-request correctness.

### Rely Only on Runtime Capability Manifests

Rejected. A developer can bypass an adapter by adding an application singleton;
manifest validation cannot inspect hidden service state.

### Rely Only on Static Analysis

Rejected. An injected adapter may still be configured with separate backends or
incorrect atomic semantics. Cross-replica behavioral evidence remains required.

## Security Impact

The controls directly reduce session split-brain, replay acceptance,
rate-limit bypass, duplicate job ownership, stale authorization, tenant cache
leakage, and ineffective revocation. Diagnostics expose only stable category
and failure codes. The rule is fail-closed and part of the existing required
boundary command.

No static rule can detect state hidden behind every factory, closure, native
module, or remote service. Security review and feature-specific replica tests
must verify that shared backends provide the required atomicity, expiry,
consistency, outage, and tenant-isolation semantics.

## Privacy and Residency Impact

Shared state inherits the classification and residency of its source data.
Hosted implementations must use approved European databases, caches, queues,
or other adapters. Self-hosted operators choose their regions and own their
privacy and compliance posture. The test harness uses only synthetic keys and
does not capture provider failures.

## Portability and Self-Hosting Impact

The policy is TypeScript- and Docker-oriented but provider-neutral. Hosted and
self-hosted services follow the same source and behavioral gates. Self-hosted
operators may choose any conforming shared backend; the open-source project
does not promise that their topology is highly available.

## Operational Impact

Instances require no sticky routing. Scale-out, restart, rolling deployment,
and termination must preserve security decisions through shared state. An
outage follows each capability's explicit failure policy rather than silently
falling back to process memory.

## Consequences

- Service authors inject repositories and adapters at composition.
- Mutable application singletons fail `pnpm check:boundaries`.
- Feature tests must wrap real public behavior in every applicable replica
  probe.
- Built-image, restart, eviction, and mixed-version tests remain later release
  gates.
- Infrastructure resources may be local only when they cannot affect
  cross-request correctness.

## Validation

- Static accepted/rejected fixtures cover services, core packages, exports,
  local values, frozen metadata, collections, sensitive factories, and banned
  packages.
- The replica suite passes all categories with one shared backend and reports
  all categories as failed with independent process backends.
- Timeout, exception, malformed definition, immutability, redaction, and
  compile-time contract tests maintain complete coverage.
- Later feature and Docker tasks must reuse the suite against real behavior.

## Review Triggers

- A false positive requires an exception or a service needs module state.
- Another core package begins implementing cross-request security behavior.
- A state mechanism evades the parser or package deny-list.
- Worker threads, clustering, native extensions, or another server runtime are
  introduced.
- Docker replica tests disagree with deterministic conformance.

## References

- [ADR-0002](0002-supported-runtimes.md)
- [ADR-0012](0012-trusted-tenant-context.md)
- [ADR-0020](0020-security-reliability-targets.md)
- [ADR-0025](0025-infrastructure-adapter-packaging.md)
