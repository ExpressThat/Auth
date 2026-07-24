# ADR-0013: Separate Management-Identity Storage

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, identity, and data engineering
- **Related tasks:** DEC-014, DB-006, DB-007, TEN-001 through TEN-012
- **Supersedes:** None
- **Superseded by:** None

## Context

Management identities authenticate administrators who can change applications,
keys, providers, policies, exports, and other users. End-user identities
authenticate people using customer applications. A person may be both, and the
same authentication features should power both experiences, but their ownership,
authorization, lifecycle, breach impact, and support rules are different.

A shared physical user table would make realm filters security-critical in every
credential, session, recovery, export, and deletion query. It could also make an
end-user account appear to be a management identity or cause matching email
addresses to link the two planes.

## Decision

Store management identities and end-user identities in separate physical table
families, repositories, sessions, credentials, issuers, and key scopes.

The separation is a trust boundary, not duplicated product logic. Authentication
services depend on typed identity-store contracts and reusable policy/protocol
components. A management realm implementation and an end-user realm
implementation satisfy the same relevant conformance suites with different
repositories and configuration.

### Management Storage Family

The management family includes dedicated tables/repositories for:

- management identities, status, profile, verified addresses, and lifecycle;
- password credentials, passkeys, MFA factors, recovery methods, and external
  identity links;
- management browser sessions, login interactions, devices, and risk state;
- customer-organisation administrator memberships and role assignments;
- protected platform-role assignments;
- invitations, recovery events, grants, and management consent where required;
  and
- management-plane security and audit references.

Names and exact normalization are defined with the database schema, but these
records use explicit `management_*` concepts and types. They do not share rows,
credential foreign keys, or session records with end users.

All management identities authenticate through the protected system
organisation and management issuer. Memberships grant a management identity
access to zero or more customer organisations. A platform administrator is a
management identity with a protected platform role; it is not inferred from
customer ownership or a global boolean on a user row.

The system organisation and management application are protected bootstrap
records. They cannot be deleted, transferred, converted to a customer tenant, or
addressed through ordinary customer APIs. Removing the last viable platform
administrator requires the break-glass policy defined by DEC-019.

### End-User Storage Family

The end-user family separately stores:

- users and their user-pool-scoped profiles and addresses;
- password credentials, passkeys, MFA factors, recovery methods, and external
  identity links;
- end-user sessions, authorization interactions, devices, and risk state;
- application grants and consent;
- end-user organisation memberships, roles, and invitations; and
- end-user lifecycle, provisioning, and security references.

End-user rows always carry the customer user-pool boundary and the environment
boundary selected by DEC-015. They cannot receive management memberships or
platform roles.

### Same Human in Both Planes

Matching email, phone, passkey user handle, social subject, enterprise subject,
device, or profile data never links, merges, or promotes identities across
planes. The same person creates or receives two independent accounts with
independent verification, credentials, sessions, MFA, recovery, risk, and
deletion lifecycles.

No ordinary API exposes a cross-plane person identifier. A future explicitly
consented account-link feature requires its own threat model, purpose,
revocation, privacy behavior, and non-transitive authorization design.

An end user cannot become an administrator by adding a management membership to
their end-user row. Administrator invitation creates or attaches only a
management identity after management-plane verification. Likewise, a management
identity does not automatically exist in any customer's user pool.

### Shared Authentication Components

The platform may share runtime-neutral implementations for:

- password policy and hashing adapters;
- passkey/WebAuthn and MFA protocol validation;
- recovery workflow engines;
- OAuth/OIDC primitives;
- canonical address parsing and verification;
- risk-signal contracts;
- session/token lifecycle algorithms; and
- provider contracts and conformance tests.

Each component receives a realm capability and typed repository explicitly.
There is no caller-controlled realm name that selects a table. The externally
routed management or customer issuer selects a statically registered realm
before untrusted identity lookup.

TypeScript uses incompatible branded identifiers such as
`ManagementIdentityId` and `EndUserId`. Repository interfaces do not inherit
from one broad CRUD repository and do not return a union that handlers must
remember to narrow.

### Database and Transaction Rules

- Foreign keys remain within one identity family except deliberate references
  from customer-organisation memberships to management identities.
- Management membership creation validates the customer organisation without
  making that organisation the owner of the identity.
- Cross-family foreign keys for credentials, sessions, recovery, consent, or
  roles are prohibited.
- Email and provider-subject uniqueness are defined independently in each realm
  and at the correct customer user-pool scope.
- Transactions cannot move or convert identity rows between families.
- Database roles or connections may be physically separated later without
  changing domain contracts.

Drizzle schemas are split into small modules and compose explicit management and
end-user migrations for SQLite and the hosted shared database. Tests inspect
constraints and query behavior in both dialects.

### Lifecycle, Export, and Audit

Deleting or anonymising an end-user identity does not delete a management
identity with matching attributes, and vice versa. Each request is authorized
under the relevant controller, purpose, retention, and legal obligation.

Customer tenant exports include administrator membership records and the
permitted management profile fields needed to understand access, but not
management credentials, unrelated memberships, or the management identity's
complete cross-customer account. A management identity can separately exercise
its own data-subject rights across the management plane.

End-user exports never discover management records by matching personal data.
Audit records preserve distinct actor/subject identifiers and minimally retained
tombstones when an identity is removed.

## Alternatives Considered

### One Identity Table with a Realm Column

Rejected. A missing realm predicate would cross the highest-risk trust boundary,
and credentials, sessions, recovery, exports, and uniqueness would remain easy
to scope incorrectly.

### One Person Record with Management and User Profiles

Rejected. It creates cross-customer correlation, coupled lifecycle behavior, and
an attractive privilege-escalation path without a product requirement.

### Completely Separate Authentication Implementations

Rejected. Separate data and trust do not require duplicating reviewed password,
passkey, MFA, OAuth/OIDC, risk, and session algorithms.

### Treat Every Customer Administrator as an End User of the System Organisation

Rejected as a physical model. It obscures management-specific authorization and
lifecycle invariants. The management experience still uses the platform's
shared authentication capabilities through the dedicated management realm.

## Security Impact

An end-user query, credential, recovery flow, or session cannot directly resolve
a management identity. Separate identifiers, repositories, issuers, keys, and
tables reduce confused-deputy and privilege-escalation paths. Shared algorithms
still receive one set of security review and tests.

## Privacy and Residency Impact

The model avoids silent cross-plane profiling and makes controller-specific
access, export, correction, restriction, and erasure possible. Both families and
their backups, logs, and events remain within the configured European region.

## Portability and Self-Hosting Impact

Logical separation works in SQLite, a shared hosted SQL database, and future
physical database partitions. It requires no provider-specific database
feature. The same Drizzle schema invariants and repository conformance tests run
for Docker deployments.

## Operational Impact

Some migrations and authentication repository adapters are duplicated by realm.
Metrics, support tools, export jobs, and deletion jobs must name the realm
explicitly. Incidents can revoke or isolate one plane without automatically
invalidating the other.

## Consequences

- The platform powers its own login with shared capabilities, not shared rows.
- Administrators use one management identity across many customer memberships.
- The same human can have independent management and end-user accounts.
- Cross-plane promotion and automatic account linking are impossible by design.
- Schema evolution must keep both repository implementations conformant.

## Validation

- Prove end-user credentials, sessions, recovery artifacts, and identifiers are
  rejected by every management entry point, and the reverse.
- Inspect all foreign keys and indexes for prohibited cross-family references.
- Run shared authentication conformance tests against both realm repositories.
- Test identical email and provider subjects in both planes without linking.
- Test administrator invitation, multi-customer membership, platform roles,
  removal, export, and erasure.
- Verify ordinary customer exports cannot reveal unrelated management
  memberships or reusable credentials.
- Run migrations and repository tests on every supported SQL dialect and both
  runtime targets.

## Review Triggers

- A consented cross-plane account-link product is proposed.
- Management and end-user data move to separate databases or services.
- An authentication feature cannot use the typed realm contracts.
- A regulatory role requires different controller or retention treatment.
