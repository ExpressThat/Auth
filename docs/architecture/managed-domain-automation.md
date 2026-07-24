# Managed-Domain Automation Contracts

Managed custom domains are a hosted-edition orchestration built from three
operator-owned infrastructure capabilities. The domain layer never imports a
provider SDK or persists vendor-specific identifiers.

## Authorization Chain

```text
validated tenant/application scope
  -> expiring DNS ownership and routing proof
  -> certificate bound to that DNS proof
  -> immutable frontend artifact bound to that certificate
  -> external reachability and issuer probes
  -> audited atomic domain activation
```

DNS, certificate, and deployment adapters return opaque references and
optimistic revisions. A reference is valid only with the same
customer-organisation, environment, and application scope that created it.
Every update, verification, removal, renewal, revocation, or rollback rejects a
stale revision.

## DNS Automation

`DnsAutomationProvider` prepares an expiring ownership challenge and expected
routing target, observes verification, removes obsolete automation state, and
reports health. A verification result distinguishes pending, verified,
expired, conflicting, and routing-mismatch states. Verification alone does not
activate a domain.

## Certificate Automation

`CertificateAutomationProvider` issues, observes, renews, and revokes
certificates. Metadata retains the DNS verification reference that authorized
issuance. Private key material never crosses this contract; adapters advertise
whether custody is keyless and whether renewal is automatic.

## Frontend Deployment Automation

`FrontendDeploymentProvider` deploys a bounded opaque artifact reference with
an exact SHA-256 digest and certificate reference. Arbitrary HTTP artifact URLs
are rejected. Updates require the current revision. Rollback copies a prior
active artifact into a new revision, preserving immutable history.

## Failure and Reconciliation

Errors expose only the capability operation, a stable normalized code, and
retryability. `unavailable` and `not-ready` are retryable where applicable;
conflict, invalid, missing, integrity, and residency failures are not.
Orchestration state and retries must be durable and shared across replicas.
Application instances must not coordinate these workflows in process memory.

The deterministic adapters under `@expressthat-auth/runtime/testing` are for
unit and conformance tests only. Selectable Docker adapters live in separate
packages and must pass the shared success, failure, timeout, retry,
concurrency, redaction, runtime, health, and tenant-isolation/residency suite.

See [ADR-0026](../decisions/0026-managed-domain-automation.md) for the binding
decision and [ADR-0008](../decisions/0008-browser-cookie-domain-topology.md) for
the complete activation and browser-security topology.
