# ADR-0019: Prefer Read-Only Support and Constrain Impersonation

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, support, privacy, and identity engineering
- **Related tasks:** DEC-020, OIDC-022, SUP-001 through SUP-012
- **Supersedes:** None
- **Superseded by:** None

## Context

Support staff need user-specific context to diagnose some issues. Giving an
administrator an ordinary user session or unrestricted "login as user" action
would bypass authentication, consent, privacy, and accountability and could
silently perform destructive or privileged actions.

## Decision

Adopt [the support and impersonation standard](../security/support-and-impersonation.md).

Support view and impersonation are separate, independently default-disabled
capabilities. Read-only support view is preferred and exposes only classified
allow-listed projections. Impersonation requires dedicated permissions, strong
recent step-up, reason/ticket, application opt-in, current eligibility, and a
non-self approval mode.

Hosted platform support requires customer owner approval plus a distinct
platform approver. Customer policy can require target-user consent, owner
approval, or two-person customer approval. There is no standing, bulk,
self-approved, or emergency bypass.

A one-time 60-second actor token creates a new opaque impersonation session for
at most 15 minutes/five idle minutes. It carries actor and subject separately,
uses an exact application/context/action allow-list, has no ordinary refresh or
token-exchange continuation, and is immediately revocable.

Management identities, machines, break-glass identities, compromised/protected
users, and other defined targets are prohibited. Credentials, security,
privacy, billing, consent/legal, role/membership, configuration, export,
deletion, and other protected actions are centrally denied.

Every access/action is correlated and audited; affected owners/security contacts
are notified, users are notified by default, and impersonated activity is
excluded from engagement/billing analytics. Evidence defaults to two years with
an approved one-to-seven-year range; transient authority is removed promptly.

## Alternatives Considered

### Copy or Steal the User's Existing Session

Rejected. It hides the actor, inherits unrestricted scope/lifetime, and makes
revocation and evidence unreliable.

### Administrator Role Is Sufficient

Rejected. Support access requires a dedicated purpose and cannot be ambient
tenant-owner or platform-admin power.

### Client-Side Read-Only or Impersonation Flag

Rejected. A hidden button or browser flag cannot enforce server authorization or
protect external application routes.

### Break Glass for Urgent Support

Rejected. Platform recovery authority explicitly cannot access/impersonate
customer users.

### Notify Nobody to Preserve the Test

Rejected. Owners/security contacts are always notified. User notification can
only be delayed under a pre-approved safety/legal investigation policy.

## Security Impact

Effective permission is the intersection of actor-approved actions and the
subject's current authorization. Strong step-up, independent approval, protected
targets/actions, single-use exchange, short lifetime, revocation, and immutable
actor/subject evidence constrain the privilege.

## Privacy and Residency Impact

Support view minimizes fields and prevents automatic ticket/download copies.
Purpose, consent/approval, notification, retention, rights export, and EU-only
hosted support/evidence are explicit.

## Portability and Self-Hosting Impact

Policies, actor tokens, sessions, signed claims, SDK middleware, audit, and
conformance are runtime-neutral. Workers and Docker use shared state and tests;
self-hosters receive no vendor support backdoor.

## Operational Impact

Support teams need EU-controlled devices/locations, dedicated permissions,
ticket integration, step-up, approver coverage, notifications, audit review, and
application opt-in/testing. Some issues will require customer/user coordination.

## Consequences

- Most diagnosis happens without becoming the user.
- Impersonation cannot silently modify identity/security/privacy authority.
- Customer applications must honor signed impersonation context and declare
  additional protected actions.
- Short sessions and approvals may need repetition for long investigations.

## Validation

- Execute the standard's protected-target/action, approval, replay, race,
  revocation, audit, notification, retention, and UI suites.
- Test every target/application with two tenants and two environments.
- Penetration-test platform and opted-in customer application integration before
  production enablement.

## Review Triggers

- A new support role, target type, action class, token/delegation feature, or
  application integration is introduced.
- Evidence/notification requirements or legal investigation policy changes.
- A support incident reveals excessive data or authority.
- The maximum session/token lifetime or approval mode changes.

