# Support Access and Impersonation Standard

- **Status:** Binding baseline
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Security, support, privacy, and identity engineering
- **Decision:** ADR-0019

## 1. Principles

Support access never becomes ambient administrator access to user data.

1. Use ordinary diagnostics and user-provided evidence first.
2. Prefer the read-only support view when user context is necessary.
3. Use impersonation only for a specific problem that cannot be resolved safely
   by support view.
4. Keep the real actor and represented subject distinct in every request,
   session, token, job, audit event, notification, and application signal.
5. Grant the minimum application, organisation, action, and time scope.
6. Never expose an existing user session or reusable credential.
7. Deny sensitive targets and actions centrally even when an application UI
   accidentally presents them.

Support view and impersonation are disabled by default at platform and customer
organisation level. Enabling one does not enable the other. Self-hosted
installations use the same defaults and policy.

## 2. Roles and Authority

Dedicated permissions are separate from owner, administrator, viewer, platform
administrator, break-glass, or ordinary support titles:

- `support:view` opens the read-only support view;
- `support:view_sensitive` reveals an individually approved masked field where
  the field policy permits it;
- `impersonation:request` creates a request;
- `impersonation:approve` approves for a customer organisation;
- `impersonation:platform_approve` supplies hosted platform dual control;
- `impersonation:revoke` ends a session; and
- `impersonation:audit` views the evidence trail.

No role receives these implicitly. Permissions can be constrained by customer
organisation, environment, application, end-user organisation, target category,
support team, and time.

A customer administrator can access only users and data in customer
organisations/environments where their current management membership grants the
exact permission. A platform support operator can act only when:

- hosted platform support access is enabled by platform security policy;
- the customer has opted in for the relevant support purpose;
- the individual request receives customer approval;
- a second platform operator/security approver authorizes it; and
- the operator has recent strong step-up and an approved EU support location.

Break-glass/recovery authority from ADR-0018 cannot request, approve, or perform
support view or impersonation. Machine/service identities cannot act as support
actors or approvers.

## 3. Read-Only Support View

Support view is a purpose-built projection, not the management user API with
buttons hidden and not an impersonated session.

It may show, when authorized and relevant:

- safe identity status and masked profile/contact fields;
- application grants, consent state, memberships, roles, and effective
  permissions with provenance;
- session/device metadata, assurance, expiry, and revocation status;
- authentication, delivery, provider, SSO/directory, webhook, and policy result
  codes;
- risk/security summaries that disclosure policy permits; and
- related audit events and request/correlation identifiers.

It never shows or returns:

- password hashes, raw tokens/codes/assertions/cookies, passkey material beyond
  safe metadata, MFA seeds, recovery codes, API/client/provider secrets, private
  keys, secret references/handles, or raw security-provider evidence;
- privacy export contents or protected migration packages;
- unrelated custom attributes, message bodies, hook payloads, or other users;
- full IP/device/contact values unless a separately classified field policy,
  purpose, and `support:view_sensitive` grant allow a bounded reveal; or
- cross-customer management memberships or management credentials.

Support view routes accept GET/HEAD only, emit `Cache-Control: no-store`, reject
batch export/print/download APIs, and use field-level allow-listed response
schemas. The frontend contains no mutation control and its credentials cannot
call mutation routes, but server-side authorization remains the boundary.

Opening a view requires a reason, incident/support ticket, selected purpose, and
target. Every search, open, sensitive reveal, and related navigation is audited.
Rendered data is not copied into tickets automatically. Screen recording,
third-party analytics, browser extensions on managed support devices, and local
downloads are prohibited by operations policy.

## 4. Eligibility

### Actor Requirements

At request, approval, actor-token exchange, session start, and every use:

- actor management identity is active and not under recovery/impersonation;
- current customer membership and dedicated permission are valid;
- platform/customer/environment/application settings still allow the mode;
- strong phishing-resistant step-up occurred within the previous five minutes;
- source network/device/risk meets support policy;
- reason and valid ticket/reference remain active; and
- actor is not the target, sole approver, or a machine identity.

### Target Requirements

Impersonation can target only an active human end-user identity in the same
customer organisation and environment, with access to the exact application.
Support view may inspect suspended/locked identities for diagnosis, but
impersonation cannot start for them.

These targets are always prohibited and cannot be enabled by customer policy:

- management identities, platform/customer administrators, or any identity in
  the management plane;
- service accounts, machine clients, workload identities, API-key owners acting
  as machines, or non-human users;
- platform bootstrap/recovery principals and enterprise SSO break-glass
  identities;
- deleted/anonymised identities or identities under an erasure/restriction state
  incompatible with the purpose;
- an identity flagged as compromised, high-risk, protected, legally restricted,
  or involved in an active administrator/security investigation; and
- a target whose current customer, environment, application, or end-user
  organisation context differs from the approved request.

Customers can add protected users/categories but cannot remove platform
prohibitions. End-user organisation owner/member status alone is not a platform
prohibition, but customer policy can require owner approval or disallow it.

## 5. Policy and Approval Modes

Platform enablement, customer enablement, application opt-in, and an allowed
approval mode are all required. Production begins disabled.

Customer policy chooses one or a stricter combination:

| Mode | Requirement |
| --- | --- |
| User consent | The target approves the exact actor/reason/application/actions/duration through their current strong session |
| Customer owner approval | A current owner with `impersonation:approve` and recent strong step-up approves |
| Two-person customer approval | Two distinct authorized customer approvers approve; neither is the requester |
| Hosted platform support | Customer owner approval plus a distinct platform approver; the requester cannot approve |

An approval names request version, actor, subject, customer, environment,
application, optional end-user organisation, actions, reason, ticket, duration,
and expiry. It cannot broaden the request. Any change creates a new version and
invalidates prior approvals.

Requests expire after 15 minutes without sufficient approval. Approval never
lasts beyond the request and cannot be reused. Membership, permission, target,
application, policy, risk, or ticket changes invalidate the request/session.
Denial is final for that request. There is no self-approval, standing approval,
bulk approval, emergency override, or fallback when an approver is unavailable.

User consent displays the real support organisation and actor display name,
reason, application, allowed actions, duration, audit/notification behavior, and
a clear decline. Decline has no adverse authentication consequence.

## 6. Actor Token and Session

After approval, the platform creates a random one-time actor token:

- maximum lifetime 60 seconds;
- stored only as a keyed hash with request/context binding;
- exact actor, subject, customer, environment, application, end-user
  organisation, action set, request version, assurance, and correlation;
- exchanged atomically once at the intended identity origin; and
- invalidated by replay, mismatch, expiry, cancellation, or state change.

The token is never placed in a URL/query, email, log, ticket, analytics, or
application callback and never reveals/copies a user's existing session.

Exchange creates a distinct opaque impersonation session:

- maximum absolute lifetime 15 minutes and idle lifetime five minutes;
- no ordinary refresh token, remember-device, session extension, offline access,
  token exchange, delegation chain, or silent renewal;
- immediate shared-state revocation on exit, expiry, request/approval revocation,
  actor/subject/membership/policy change, or risk event;
- session cookie name/purpose distinct from an ordinary end-user session; and
- one active impersonation session per request.

Tokens issued for an opted-in customer application have the shortest practical
lifetime, one exact audience, no refresh/offline scope, reduced approved scopes,
unique session/request IDs, subject in `sub`, and actor in an RFC 8693-compatible
`act` claim plus explicit platform impersonation metadata. An impersonation token
cannot be used as the subject token for another exchange or impersonation.

The request context preserves actor and subject separately. Authorization first
checks the actor's approved action set and then evaluates the subject's current
ordinary authorization. Effective permission is the intersection; impersonation
can never grant more than either side allows.

## 7. Protected Actions

The following are always denied during impersonation:

- view/add/remove/change password, passkey, MFA, recovery, linked identity,
  verified email/phone, device trust, session, API key, client/provider secret,
  signing/encryption key, or security notification destination;
- create/download privacy or tenant exports, protected migration packages,
  recovery artifacts, invoices/payment data, or bulk user data;
- delete/anonymise/merge an account, withdraw/accept legal terms or consent,
  change privacy choices, exercise rights, or alter legal holds;
- create/accept/revoke invitations; create/delete/transfer organisations; change
  ownership, membership, group, role, permission, domain, SSO/SCIM, policy,
  application grant, callback, origin, provider, hook, webhook, billing, or
  environment configuration;
- increase privilege, switch into an unapproved organisation/context, approve
  another request, impersonate again, or perform support/platform operations;
- issue refresh/offline/machine credentials, token exchange/delegation, or
  authorize another application; and
- perform an application-defined financial, legal, destructive, security,
  privacy, administrator, or other protected operation.

Platform-owned APIs enforce this central deny-list from trusted request context,
not a browser flag. Customer applications receive signed actor/session/action
claims and SDK middleware for route policy. An application must explicitly opt
in and declare/test its additional protected operations before impersonation is
enabled for it.

Read-only diagnosis and ordinary low-risk application actions are allowed only
when explicitly named in the approved action set. Unknown/new actions default to
denied until classified.

## 8. User Experience and Notifications

Every impersonated page shows an unmistakable, non-dismissible banner with:

- support/actor identity;
- represented user and organisation/application context;
- remaining absolute time;
- approved purpose/action summary; and
- a persistent exit control.

The banner is server-derived and survives navigation/error/empty/loading states.
Frame policy prevents an application from hiding the platform banner where the
platform hosts the experience. SDK-integrated customer applications must meet
the same conformance requirement.

Customer owners/security contacts are notified at request, approval/start,
protected-action denial, and end. The target user is notified at start and end
by default. A customer can suppress immediate target notification only for a
documented safety/legal investigation policy approved before the request; the
notification is delayed, not deleted, unless law prohibits it. Platform support
also notifies the platform security channel.

Notification contains actor organisation, purpose/ticket reference, application,
start/end, and review/report links, but no sensitive viewed data.

## 9. Audit, Analytics, and Retention

One immutable correlation trail records:

- policy enable/disable and application opt-in;
- user search/support-view open/field reveal/close;
- request, version, reason/ticket, risk and assurance;
- approval, denial, expiry, invalidation, and consent;
- actor-token creation/exchange/replay denial;
- session start, context, every platform/API operation and result;
- protected-action denial, application-reported action, exit, revocation, and
  expiry; and
- notification attempt/result and delayed/suppressed legal basis.

Events include real actor, subject, approvers, tenant/environment/application,
end-user organisation where applicable, action set, source, request/session IDs,
and safe before/after metadata. They contain no credentials, secrets, message
bodies, or support-view field values.

Impersonated actions are marked at ingestion and excluded from ordinary user
engagement, product conversion, fraud-training, personalization, and billable
active-user metrics. Security and support-accountability metrics use a separate
purpose and restricted aggregate.

Retention:

- raw actor tokens are never stored; keyed hashes/replay tombstones expire
  within 30 days;
- impersonation sessions and transient context are purged within 24 hours after
  revocation/expiry except identifiers needed by audit;
- request, approval, denial, consent, support-view, notification, and
  impersonation audit evidence defaults to two years;
- customers can select an approved one-to-seven-year evidence period subject to
  contract, legal holds, controller duties, and platform security minimums; and
- rendered support data, local downloads, screenshots, recordings, and ticket
  copies are not retained by the platform support workflow.

All hosted processing/evidence remains in the EU under ADR-0017. Data-subject
exports include applicable support/impersonation history without disclosing
other people's protected personal data or security internals.

## 10. Failure and Concurrency

Every stage fails closed. Provider, notification, audit, risk, membership,
database, key, clock, or policy uncertainty cannot create or extend authority.
An approved request does not reserve stale permissions.

Atomic compare-and-swap transitions and shared revocation handle:

- concurrent approval/denial/cancel/expiry;
- actor token replay from multiple instances;
- simultaneous session start and policy/membership/target changes;
- action racing session revocation or expiry;
- target role changes during an active session; and
- duplicate notifications/audit delivery.

External customer application effects use the session/action identifiers and
idempotency where applicable. Revocation propagates through introspection/
short-lived tokens; the residual lifetime is shown in application enablement.

## 11. Validation

- Test every prohibited actor, target, action, context, approval combination,
  scope increase, state change, and cross-tenant/environment attempt.
- Test support-view schemas cannot mutate, export, cache, or reveal
  credential/secret/unclassified fields.
- Race request versions, approvals, consent, token exchange, session use,
  revocation, membership/policy changes, and expiry across instances.
- Replay actor and application tokens; attempt refresh, token exchange,
  delegation, changed audience/context, and nested impersonation.
- Verify signed actor/subject claims and central protected-action denial in
  Workers, Docker, platform APIs, SDK middleware, and opted-in applications.
- Assert permanent banner/exit behavior on every route/state and immediate
  server revocation even if client cleanup fails.
- Assert complete correlated audit/notifications, delayed-notification policy,
  retention, data-subject export, and analytics/billing exclusion.
- Conduct abuse review and penetration testing before enabling production
  impersonation.

