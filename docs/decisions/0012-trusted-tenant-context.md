# ADR-0012: Trusted Tenant-Context Resolution

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, identity, API, and data engineering
- **Related tasks:** DEC-013, API-001 through API-018, IAM-001 through IAM-014
- **Supersedes:** None
- **Superseded by:** None

## Context

One person can administer several customer organisations and belong to several
end-user organisations. The platform also has a protected management
organisation, multiple applications, and isolated environments. Browser routes,
custom domains, tokens, API keys, jobs, and resource identifiers can all provide
context clues, but none may let a caller choose a tenant they cannot access.

Tenant confusion would expose identities, credentials, configuration, audit
records, or provider resources across organisations. The resolution rules must
therefore be explicit, identical on Workers and Docker, and unavoidable in data
access.

## Decision

### Distinct Context Dimensions

The following are separate typed identifiers and are never interchangeable:

- `managementOrganisationId` identifies the non-deletable platform organisation
  in which management identities authenticate;
- `customerOrganisationId` identifies a customer's top-level administrative and
  user-pool boundary;
- `environmentId` identifies one isolated deployment environment belonging to a
  customer organisation;
- `applicationId` identifies a registered application in that organisation and
  environment; and
- `endUserOrganisationId` optionally identifies the enterprise/sub-organisation
  in which an end user is currently acting.

The protected management organisation is not a customer organisation and never
owns customer applications or end users. A management principal can hold
memberships in many customer organisations without moving or duplicating their
management identity.

An active organisation is a user-interface convenience, not an authorization
grant. Every request revalidates the selected context against current
memberships, roles, resource ownership, session state, and policy.

### Resolution Principles

1. Authenticate the credential and validate its intended protocol use before
   resolving tenant-owned resources.
2. Resolve context from authoritative credential bindings and active verified
   mappings.
3. Cross-check every additional route, host, token, header, and resource signal.
4. Fail closed when signals disagree; never apply a "first value wins" rule.
5. Authorize the actor, action, subject, resource, and context after resolution.
6. Pass one immutable trusted context to repositories and adapters.

Untrusted request values can locate a candidate record, but cannot make that
record trusted. Slugs, display names, email domains, arbitrary `Host`,
`X-Organisation-Id`, `X-Application-Id`, or similar headers are never tenant
authority.

### Management Requests

The management session authenticates a management principal in the management
plane only. A customer organisation is then selected by:

- an explicit route resource, such as
  `/v1/organisations/{customerOrganisationId}/applications`; or
- a short-lived, server-issued context reference used by the dashboard.

The server verifies an active management membership and required role in the
selected customer organisation. Any resource in the route must belong to that
same organisation and environment.

Organisation switching rotates or updates server-side session context and is
audited. To avoid two browser tabs racing over one global active organisation,
each tab keeps an opaque context reference in tab-local storage and sends it
with requests. The reference contains no authority by itself and is checked
against the current session and memberships on every use.

The management API may accept an explicit organisation identifier for SDK/CLI
use only when the management credential is independently authenticated and the
membership is revalidated. It does not trust a browser preference or header
without that binding.

### Application and Environment Requests

Application context comes from one or more authenticated sources:

- a registered OAuth/OIDC `client_id` and its redirect/interaction record;
- a validated access token's issuer, audience, authorised party, and token type;
- API-key metadata loaded after verifying the presented key;
- a verified identity-domain mapping from ADR-0008; or
- a persisted server-side interaction, session, job, or webhook subscription.

Environment context is explicit in the bound application, issuer, key, session,
or route. Applications, issuers, credentials, callbacks, and sessions belong to
exactly one environment.

If a host mapping, client credential, token, route, or persisted interaction
names different organisations, environments, or applications, processing stops
with a safe error and a security audit event. A custom hostname is useful only
after it resolves to an active verified-domain record. Raw or forwarded host
values are not trusted outside the allow-listed proxy rules in ADR-0008.

Public sign-up and authorization entry points resolve an application using its
public client identifier and/or verified hostname, then cross-check redirect
URIs and issuer. They do not reveal whether unrelated organisation or
application identifiers exist.

### End-User Organisation Requests

An end-user identity belongs to the top-level customer user pool and may have
many end-user organisation memberships. The active end-user organisation is
optional unless the application or operation requires one.

It is selected through a server-issued, application- and session-bound context
reference or an explicit resource in a token/API route. Selection requires:

- current membership in the target end-user organisation;
- that organisation belonging to the authenticated customer organisation;
- application access to that organisation under current policy; and
- any role, assurance, or step-up requirements for the operation.

Switching end-user organisation rotates the browser session reference and issues
new tokens where token claims include active organisation context. Existing
tokens do not silently change meaning. A token scoped to one end-user
organisation cannot access another, even when its subject belongs to both.

Consent remains application-specific. Shared user-pool authentication does not
grant an application profile access merely because another application created
the user. The sign-up application receives only the first-party access declared
by product policy; every other application requires the applicable consent or
administrative grant.

### Credential and Token Validation

Before claims contribute context, validators check signature/MAC, algorithm,
issuer, audience, authorised party, expiry/not-before, token type, key status,
and replay or revocation state as applicable.

Claims are signed evidence, not permanent authorization. Sensitive operations
check current user, client, membership, role, consent, policy, credential, and
session versions in shared state. Revocation and version checks cannot rely on
in-process caches.

Tokens and session records carry the minimum identifiers needed to bind context.
They never accept a request-supplied tenant identifier that conflicts with the
credential. Bearer tokens intended for customer APIs are never accepted by the
management plane or vice versa.

### Impersonation and Delegation

Trusted context always represents `actor` and `subject` separately when support
impersonation or delegated administration is active. The actor remains the
authenticated human/service; the subject is the identity whose view is being
used.

Impersonation has an explicit grant, permitted target and organisation, allowed
actions, reason, approval state, expiry, and session identifier. It cannot
select a context the actor's impersonation grant forbids, erase the actor from
audit events, or mint an ordinary indistinguishable session. DEC-020 defines the
detailed policy.

### Repository and Adapter Enforcement

Every tenant-owned repository method requires a structured `TenantContext`.
There is no optional, global, or default customer context. Reads and writes
predicate on the trusted customer organisation and environment in the same
query as resource identity. End-user-organisation predicates are also required
where the resource is scoped to one.

Identifiers use branded TypeScript types so management organisation, customer
organisation, application, environment, and end-user organisation identifiers
cannot be passed interchangeably. Repositories expose task-specific methods
instead of accepting caller-built filters or raw SQL.

Foreign keys and unique indexes include the appropriate ownership boundary.
Where a database cannot express a cross-table invariant directly, the
transactional repository enforces it and conformance tests prove it on every
supported database.

Provider adapter instances are created from configuration selected by trusted
customer organisation and environment. Callers cannot supply provider account,
bucket, queue, sender, key, or namespace identifiers directly.

### Asynchronous and Event Context

Jobs, scheduled work, webhooks, audit events, outbox records, and provider
callbacks persist a versioned context envelope at creation. Workers resolve the
envelope from shared storage and revalidate current resource ownership before
effects. Queue message headers alone are not authority.

The envelope records the actor/service, customer organisation, environment,
application when applicable, end-user organisation when applicable, originating
request/correlation IDs, purpose, and schema version. Its integrity is protected
and it contains references rather than unnecessary personal data or secrets.

Retries preserve the same context and idempotency scope. Dead-letter,
reconciliation, and replay tools cannot change tenant context as a side effect
of moving a message.

### Errors, Logging, and Caching

Cross-context absence and mismatch use non-enumerating 404 or 403 responses
according to the endpoint's disclosure policy. Internal logs and audit events
record the safe reason, all resolved identifiers, and actor, without recording
credentials or unnecessary personal data.

Tenant-derived state is never held as authoritative process-local state. Shared
cache and rate-limit keys include verified organisation, environment,
application, and purpose dimensions as applicable, plus a policy/configuration
version. Cache entries cannot be selected by an untrusted header alone.

## Alternatives Considered

### Trust an Organisation Header

Rejected. A header is caller-controlled and becomes a cross-tenant data path
unless independently bound to an authenticated membership and every resource.

### Put the Active Organisation Only in One Browser Cookie

Rejected. Multiple tabs switching different organisations would race, and a
stale cookie could be mistaken for authority.

### Infer the Customer from an Email Domain

Rejected. Domains can be shared, change ownership, and do not prove membership
or application binding.

### Rely Only on Globally Unique Resource IDs

Rejected. Unique identifiers reduce accidental collisions but do not enforce
ownership, conceal existence, or prevent confused-deputy bugs.

### Trust Signed Role Claims Until Token Expiry

Rejected for sensitive operations because membership, consent, role, and access
can be revoked before a long-lived token expires.

## Security Impact

All context signals are cross-checked and repository queries carry tenant
predicates, reducing confused-deputy and insecure-direct-object-reference risk.
Actor/subject separation keeps impersonation attributable. Failures do not
enumerate other tenants.

## Privacy and Residency Impact

Context envelopes use identifiers and purpose rather than copied profile data.
Trusted scoping is also the basis for complete customer export, user access,
retention, and erasure jobs without crossing tenant boundaries. Context records,
logs, jobs, and caches remain within the configured European processing region.

## Portability and Self-Hosting Impact

Resolution uses application repositories and signed/opaque context codecs rather
than platform routing globals. Verified host and proxy adapters normalize
Workers and Docker inputs into the same trusted context and run the same
conformance suite.

## Operational Impact

Every entry point needs a context resolver before domain handlers. Auditable
mismatch metrics help detect attacks and deployment mistakes. Membership and
configuration version checks add shared-store reads that must be optimized
without weakening revocation.

## Consequences

- Multi-organisation switching works without merging identity trust boundaries.
- Handlers and adapters cannot operate on tenant data without explicit context.
- Some requests repeat current-state checks even when their token is valid.
- Background work carries more metadata but cannot lose its ownership boundary.
- Context disagreement causes a hard failure instead of implicit correction.

## Validation

- Run the same context conformance suite against Workers and Docker.
- Test every pair of mismatched host, issuer, client, token, route, API key,
  session, organisation, environment, and application.
- Attempt horizontal and vertical access with valid identifiers from another
  tenant and assert safe errors plus audit events.
- Exercise simultaneous organisation choices in multiple browser tabs.
- Revoke memberships, consent, roles, applications, and sessions during active
  requests and queued work.
- Fuzz forwarded hosts and context headers across trusted/untrusted proxy paths.
- Prove repositories include tenant predicates for reads, writes, uniqueness,
  pagination cursors, exports, and erasure.
- Verify impersonation audits preserve actor and subject through API, jobs,
  webhooks, and provider calls.

## Review Triggers

- A resource needs to span customer organisations or environments.
- Stateless authorization is proposed for a revocable operation.
- A new custom-domain, proxy, federation, token-exchange, or delegation flow is
  introduced.
- Database row-level security or physical tenant partitioning is added.
- Context checks materially prevent reliability or latency targets.

