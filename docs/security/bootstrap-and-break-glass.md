# Bootstrap and Break-Glass Standard

- **Status:** Binding baseline
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Security and platform operations
- **Decision:** ADR-0018

## 1. Security Goals

The platform must create its first administrator and recover from loss or
compromise of ordinary management authentication without a permanent backdoor.
The process must:

- work on Workers and Docker without a runtime-specific authentication bypass;
- keep the protected system organisation, management issuer, and management
  application non-deletable;
- require explicit deployment authority and short-lived one-time artifacts;
- make every grant and action attributable, narrow, expiring, and externally
  evident;
- remain usable when ordinary identity UI/provider/MFA paths are broken; and
- never expose customer credentials, secrets, or unrelated personal data merely
  because recovery mode is active.

Bootstrap creates ordinary strong management authentication. Break glass creates
temporary recovery authority; it is not an alternative everyday sign-in method.

## 2. Installation State Machine

```text
unprovisioned -> bootstrapping -> active
                      |
                      +-> unprovisioned (expired/aborted before commit)

active -> recovery-requested -> recovery-active -> active
             |                       |
             +-----------------------+-> active (expired/cancelled)
```

Transitions use database compare-and-swap versions and immutable audit events.
There is one installation record and one protected system-organisation
identifier. A second instance or retry observes the same shared state; no
process-local flag decides whether bootstrap or recovery is allowed.

`active` can never transition back to `unprovisioned` through an API, migration,
restore, environment variable, or configuration option. Restores preserve the
installation identifier, state, recovery-key epoch, audit order, and protected
record identifiers.

## 3. Initial Installation

### 3.1 Pre-Bootstrap Migration

The dedicated migration/install command atomically creates:

- the installation record with a random immutable installation ID;
- the protected system organisation;
- the management issuer and first-party management application;
- the management origin and secure baseline policy;
- empty management-identity and platform-role tables;
- audit/outbox state; and
- the recovery-custodian public-key registry and bootstrap state.

The command verifies database schema, EU residency policy for hosted installs,
management/identity origin separation, key/secret custody, HTTPS, clock/random
health, audit delivery, and that no conflicting protected record exists. It does
not create a default user, password, API key, or session.

### 3.2 Deployment Authority

Bootstrap creation is available only to a deployment operator through a
separate installation-control channel:

- hosted deployments use a restricted EU operations identity, private
  administrative route, mTLS/workload identity, and an independently audited
  deployment permission;
- Docker deployments use `authctl` from the host/control network with direct
  access to the configured installation-control endpoint and an operator secret
  or client certificate; and
- local development can use the same command with an explicitly local profile
  and conspicuous test credentials that production validation rejects.

The public management, identity, and platform APIs cannot create a bootstrap
challenge. Merely reaching an empty installation over the internet grants
nothing and returns no installation detail.

### 3.3 One-Time Bootstrap Challenge

An authorized operator runs `authctl bootstrap create`. The service:

1. verifies `unprovisioned` state and installation-control authority;
2. creates 256 bits of secure random challenge material;
3. stores only a keyed hash, purpose, installation ID, management origin,
   creation/expiry, attempt budget, creator identity, and state;
4. sets a maximum 15-minute expiry and one active challenge;
5. prints the secret once through the operator channel or writes it to a new
   owner-only file when explicitly requested; and
6. emits an external installation audit event without the secret.

The secret is sent in a POST body, never a URL/query, log, shell command
argument, environment variable, analytics event, or support bundle. A browser
handoff may place it in a URL fragment only long enough for a local page to
remove it from history and submit it over the exact management origin; CLI
completion is the preferred production path.

Invalid attempts use bounded non-enumerating errors and rate limits. Expiry,
cancellation, excessive attempts, operator revocation, or any successful commit
permanently invalidates the challenge.

### 3.4 First Platform Administrator

Bootstrap completion:

1. verifies and atomically reserves the challenge;
2. collects a normalized management address and verifies control through an
   approved EU delivery/provider flow or an operator-attested offline ceremony;
3. requires registration of a phishing-resistant passkey or equivalent
   hardware-backed management authenticator;
4. creates recovery codes once, stores only keyed hashes, and requires explicit
   custody confirmation;
5. creates the management identity, protected platform-administrator role, and
   management session in one transaction with challenge consumption;
6. rotates the session and records the authentication method/time;
7. changes installation state to `active`; and
8. emits primary and independent audit/notification evidence.

A password alone is insufficient for the first platform administrator. If the
transaction fails, no administrator, platform role, session, or consumed
challenge can exist partially. External verification effects reconcile through
idempotent persisted state.

Production readiness requires at least two independently controlled active
platform administrators, each with strong MFA/passkey and tested recovery,
before customer onboarding. The first administrator must invite the second;
bootstrap is not reopened.

### 3.5 Bootstrap Closure

After activation:

- bootstrap creation/completion routes return a generic disabled response;
- deployment configuration cannot re-enable them;
- unused bootstrap material is revoked and purged on schedule;
- installation-control authority loses bootstrap permission but retains only
  explicitly approved operational permissions; and
- a startup invariant fails if the installation is active but protected records
  are missing, mutable, duplicated, or inconsistent.

## 4. Recovery Custody

### 4.1 Offline Custodian Keys

Before production readiness, three independent custodians register offline P-256
signing public keys through an authenticated, dual-approved ceremony. Private
keys are generated by the published offline `authctl recovery-key` tool and
stored separately on hardware/offline media; they never enter the platform,
password manager shared with production, CI, support system, or ordinary KMS
signing identity.

Two distinct current custodian signatures are required for a recovery grant.
Custodians must be different people and must not all report through one ordinary
platform access path. Hosted custody uses geographically separate EU-controlled
storage. Self-hosters receive the same mechanism and custody runbook.

The registry stores public key, fingerprint, custodian role/contact reference,
status, created/rotated/revoked time, and epoch. It does not store private
material. Adding, revoking, or replacing a key while the installation is healthy
requires two platform administrators with recent strong step-up plus one current
offline custodian signature. Emergency replacement follows a separately
documented quorum ceremony.

### 4.2 Recovery Preparedness

Custodians receive:

- verified offline tool binaries and checksums/signatures;
- canonical challenge format and human-readable action summary;
- secure communication and identity-verification procedure;
- loss/compromise reporting and key revocation steps;
- database/key/audit backup recovery references; and
- a quarterly non-production/signature drill schedule.

No one custodian holds a full shared recovery secret. Printed/static recovery
codes are not accepted as the production break-glass mechanism.

## 5. Break-Glass Ceremony

### 5.1 Create a Recovery Request

An operator with installation-control access submits:

- installation ID and recovery key epoch;
- incident/change ticket and detailed reason;
- requested recovery action set;
- intended temporary principal or existing management identity;
- network/source restriction;
- maximum requested duration; and
- a fresh operator-generated correlation value.

The service creates a random nonce and canonical signed challenge containing
those fields, issue/expiry times, current protected-state digest, and request ID.
Expiry is at most 15 minutes for collecting signatures. Only one request for the
same incident/action can be active, and repeated creation is idempotent.

The challenge contains no customer personal data, credentials, or secrets.
Custodians verify the installation fingerprint, reason, action list, expiry,
operator identity through an independent channel, and incident declaration
before signing offline.

### 5.2 Authorize

The installation-control service verifies:

- two signatures from distinct active custodian keys in the current epoch;
- exact canonical challenge bytes and approved algorithms;
- nonce, installation, state digest, action set, source, and expiry;
- request state, replay absence, and operator authority; and
- required primary/independent audit sinks are available.

It atomically consumes the request and creates a non-renewable recovery grant
and temporary `RecoveryPrincipal`. The grant lasts at most 30 minutes and is
bound to exact actions, source/network/workload identity, installation, incident,
actor chain, and session. Shorter durations apply where possible.

No generic platform-admin role or ordinary refresh token is issued. Another
ceremony is required after expiry or for additional actions.

### 5.3 Allowed Recovery Actions

The default allow-list is limited to:

- inspect redacted installation, dependency, schema, issuer, key, audit, and
  management-authentication health;
- revoke management sessions/tokens and disable a compromised management
  identity or provider;
- restore access to an existing verified management identity after registering a
  new strong authenticator;
- create one expiring emergency management identity when no verified identity
  can be recovered;
- restore the minimum required platform-administrator role;
- stage/emergency-rotate management issuer, cookie, context, or relevant
  deployment credentials through their normal custody workflows;
- disable affected public authentication/management functions safely; and
- end/cancel the recovery grant.

Each action has its own current-state precondition, confirmation, idempotency
key, result, and audit event.

### 5.4 Prohibited Recovery Actions

Break glass cannot:

- impersonate an end user or customer administrator;
- read/export customer or user data, password hashes, tokens, provider secrets,
  private keys, or backup plaintext;
- alter customer applications, callbacks, roles, consent, billing, exports,
  retention, or residency policy;
- suppress/modify/delete audit, notifications, findings, or the incident reason;
- weaken management MFA, cookie, issuer, key, or tenant-isolation minimums;
- create a permanent recovery credential, API key, service account, or session;
- change recovery custodians/threshold or authorize itself;
- delete/transfer the protected system organisation;
- execute arbitrary SQL, shell commands, provider calls, or customer jobs; or
- turn an unavailable dependency into a fail-open authorization path.

Database/infrastructure restore, network repair, and deployment rollback use
their separate operator runbooks and identities. Recovery mode validates their
result but is not a remote root console.

### 5.5 Evidence and Notification

Request creation, every signature fingerprint, authorization, login, action,
denial, expiry, cancellation, and termination is written to:

1. the primary append-only platform audit store; and
2. an independently controlled EU audit destination.

Audit includes real operator/custodian actors, recovery principal, reason/ticket,
scope, state versions, before/after safe summaries, source, request/correlation,
and time—never signed secret material or credentials.

All active platform administrators and the security incident channel are
notified at request creation, grant activation, high-impact action, and end.
Notification failure blocks grant activation unless the incident procedure
records a separately authorized channel outage in both audit sinks.

### 5.6 End and Follow-Up

Expiry, explicit end, source change, state mismatch, custodian revocation, or
incident cancellation immediately revokes the recovery principal and rotates its
session reference. Temporary emergency identities are disabled at grant expiry
and cannot sign in normally.

Before incident closure:

- establish at least two ordinary strong platform administrators;
- revoke affected sessions/credentials and complete required rotations;
- reconcile installation/key/audit/notification state;
- verify no prohibited customer-data access or configuration change occurred;
- preserve bounded evidence and publish required customer/regulatory notices;
- rotate compromised custodian keys if relevant;
- add threat-model and regression/runbook improvements; and
- obtain independent security sign-off on recovery-principal removal.

## 6. Dependency Failure and Disaster Recovery

The recovery control service has a minimal dependency set: trusted installation
control ingress, secure clock/random/crypto, primary database, recovery public
keys, and two audit sinks. It does not depend on the normal management UI,
customer identity issuer, social/enterprise provider, email delivery, queue,
cache, or customer-configured adapters.

If the primary database or signing/key custody is unavailable, operators first
use offline infrastructure disaster-recovery procedures. Restored state must
preserve installation ID, protected records, recovery epoch, consumed challenges,
revocation, deletion tombstones, keys/custody mapping, and audit order. A restore
cannot set `unprovisioned` or create an administrator automatically.

If one audit sink is unavailable, recovery activation fails unless a separately
pre-approved disaster procedure supplies another immutable EU sink and records
why. If clock or secure randomness is untrustworthy, no new bootstrap/recovery
authority is issued.

## 7. Runtime Profiles

Workers and Docker use the same challenge schemas, signature validation, state
machines, policy, repositories, and tests.

- Workers exposes installation control only through a separate restricted route/
  service binding and approved EU operations identity, never the public Hono app.
- Docker binds installation control to loopback/private control network by
  default, requires mTLS/operator credential, and ships no open recovery port.
- Both use shared transactional storage and external audit; neither uses a
  process flag, local file, hard-coded account, or runtime environment variable
  as recovery authority.
- Local development uses a distinct installation ID, test-only keys, obvious UI/
  audit markers, and configuration that cannot validate as production.

## 8. Validation and Exercises

- Model every state transition, retry, expiry, replay, cancellation, partial
  commit, and concurrent instance.
- Attempt public discovery/use of bootstrap and recovery endpoints.
- Test wrong installation, state digest, action, source, epoch, key, signature,
  algorithm, expiry, duplicate custodian, replay, and insufficient quorum.
- Prove prohibited APIs/data remain inaccessible to a valid recovery principal.
- Prove every allowed action has exact scope, idempotency, expiry, notification,
  and dual audit.
- Exercise first-admin creation, second-admin readiness, authenticator loss,
  compromised admin/provider/key, normal and emergency custodian rotation,
  database restore, audit-sink outage, and total management-UI outage.
- Run black-box ceremonies against Workers and the built Docker image using
  production-equivalent networking and synthetic identities.
- Conduct a quarterly recovery-signature drill and annual full break-glass/
  restore exercise; remediate all evidence gaps.

