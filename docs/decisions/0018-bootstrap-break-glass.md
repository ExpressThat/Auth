# ADR-0018: Use One-Time Bootstrap and Quorum Break Glass

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security and platform operations
- **Related tasks:** DEC-019, TEN-001 through TEN-005, OPS-024
- **Supersedes:** None
- **Superseded by:** None

## Context

The management dashboard uses the platform's own authentication, but no
administrator exists on first installation. Ordinary management authentication
can later become unavailable or compromised. A default password, reusable setup
token, environment-variable bypass, or hidden superuser would turn recovery into
the platform's most dangerous permanent credential.

## Decision

Adopt [the bootstrap and break-glass standard](../security/bootstrap-and-break-glass.md).

Initial installation uses a deployment-authorized, 256-bit, single-use,
hashed-at-rest challenge with a maximum 15-minute lifetime. It creates the first
ordinary management identity only after strong authenticator enrolment and
atomically closes bootstrap forever. Production readiness requires a second
independently controlled strong platform administrator.

Emergency recovery uses two signatures from three registered offline custodian
keys over an exact, short-lived challenge. It creates a non-renewable,
action/source/incident-bound `RecoveryPrincipal` for at most 30 minutes, not an
ordinary platform-admin session.

Recovery actions are a narrow allow-list for restoring management access,
revoking compromised authority, rotating management security material, and
safe service containment. Customer data access/export, impersonation, arbitrary
configuration/SQL/shell, audit changes, policy weakening, permanent credentials,
and custodian changes are prohibited.

Every request, signature, grant, action, and end is recorded in primary and
independent EU audit sinks and notifies security/platform administrators.
All Docker replicas share the same state machines and validators through a
separate restricted installation-control channel.

## Alternatives Considered

### Default Administrator Password or Environment Variable

Rejected. It is easily copied, survives installation, leaks through deployment
systems, and creates an undocumented universal bypass.

### Email Support to Reset a Platform Administrator

Rejected. Support identity proof and email compromise cannot safely grant root
authority without cryptographic quorum and complete evidence.

### One Offline Master Recovery Secret

Rejected. Theft, loss, coercion, or misuse by one custodian would be sufficient.

### Ordinary Platform Administrators Approve Break Glass

Rejected as the sole path because their credentials or authentication service
may be exactly what is unavailable or compromised.

### Recovery as Full Root Console

Rejected. Infrastructure repair has separate operator identities; application
recovery should expose only reviewed state transitions.

## Security Impact

There is no permanent authentication bypass. Strong quorum, narrow capabilities,
short expiry, source binding, dual audit, notification, and prohibited customer
data access reduce insider and compromised-operator risk.

## Privacy and Residency Impact

Recovery cannot browse, export, or impersonate customer/end-user data. Challenges
contain no personal data, and hosted custody, control execution, evidence, and
support remain in the EU.

## Portability and Self-Hosting Impact

Portable P-256 signatures, transactional repositories, `authctl`, and a
restricted Hono control service work in Docker. Self-hosters control
their custodian and infrastructure identities without a vendor master key.

## Operational Impact

Organisations must maintain independent custodians, offline tools/keys, a second
administrator, two audit sinks, and regular exercises. Recovery can fail closed
when quorum, trusted time/randomness, database, or evidence is unavailable.

## Consequences

- Initial setup is deliberate and cannot be reopened casually.
- Recovery has less power than an ordinary healthy platform administrator.
- Losing too many custodian keys requires a difficult documented recovery
  ceremony rather than a vendor backdoor.
- Operations must keep offline materials and exercises current.

## Validation

- Execute every bootstrap/recovery test and exercise in the binding standard.
- Inspect artifacts/configuration for default credentials and public control
  routes.
- Prove one custodian, an expired/replayed challenge, or a valid grant requesting
  a prohibited action cannot succeed.
- Prove recovery expiry removes all temporary access and preserves audit.

## Review Triggers

- A new platform-root operation or management recovery path is introduced.
- Custodian algorithms, threshold, storage, or organizational independence
  changes.
- A real exercise or incident cannot recover within the target.
- A runtime cannot isolate the installation-control channel.
