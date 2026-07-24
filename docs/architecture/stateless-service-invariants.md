# Stateless Service Invariants

API and job containers are replaceable compute. A request may reach any replica,
and a process may terminate after any externally visible step. Sticky sessions
and warm-process history are never correctness requirements.

## State Placement

Cross-request state belongs behind an injected shared capability:

| State | Authoritative mechanism |
| --- | --- |
| Users, organisations, grants, sessions, tokens, consent, revocation | Transactional repositories |
| Nonces, one-time tokens, authorization codes | Atomic consume in a repository or conforming shared adapter |
| Rate limits and bounded caches | Distributed cache/rate-limit adapter with explicit outage policy |
| Job ownership and retries | Durable queue leases and idempotency metadata |
| Locks and singleton work | Database transition or distributed lease |
| Keys, secrets, objects, provider configuration | Their dedicated runtime adapters |

Process memory may contain immutable configuration, bounded connection pools,
provider clients, cryptographic library state, and request-local memoization.
These resources cannot become an authorization source, survive-request cache,
lease, retry ledger, or fallback when a shared dependency fails.

## Automated Source Gate

`pnpm check:boundaries` parses production TypeScript/JavaScript in server
applications, jobs, domain, authorization, and protocol workspaces. It rejects
mutable module declarations, module-level mutable containers, persistent
service collection fields, sensitive process-store factories, and known local
cache/lock packages.

Module metadata that must be shared across requests is explicitly frozen.
Mutable request-local values declared inside a handler are accepted. Browser
workspaces are outside this server rule because each end-user browser has its
own UI state; browser state still cannot authorize a server request.

The source gate prevents common accidental singletons. It cannot prove a
repository is shared, durable, atomic, tenant-safe, or correctly configured.

## Replica-State Conformance

`ReplicaStateConformanceSuite` requires one probe for each high-risk category:

- authorization;
- job ownership;
- locks;
- nonces;
- rate limits;
- sessions; and
- tenant caches.

Each probe exercises distinct primary and secondary identities through the
feature's public behavior. A conforming feature must show cross-replica
visibility or single-owner atomicity as appropriate. The suite has a bounded
timeout and normalizes false results and thrown failures without serializing
their details.

The built-in deterministic proof deliberately gives two replicas either one
shared backend or separate process backends. Shared state passes every category;
separate state fails every category. Feature tasks replace that generic proof
with their repositories, adapters, APIs, and job handlers.

## Required Feature Evidence

When a feature adds any listed state:

1. add a deterministic replica probe using independently composed instances;
2. cover dependency outage and prove there is no local fallback;
3. test atomic races, expiry, retries, restart, and tenant isolation;
4. run the same probe against the built Docker topology when an entry point
   exists; and
5. retain the result in the task and release evidence.

Connection reuse or a process-local optimization is allowed only when eviction,
staleness, or instance disagreement cannot change correctness. The
authoritative source is always rechecked when the operation requires it.

See [ADR-0027](../decisions/0027-stateless-service-enforcement.md) for the
binding decision.
