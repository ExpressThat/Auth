# ADR-0014: Isolate Every Customer Environment

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, identity, data, and platform engineering
- **Related tasks:** DEC-015, DB-006 through DB-020, TEN-013 through TEN-020
- **Supersedes:** None
- **Superseded by:** None

## Context

Customer administrators need development, staging, and production environments.
They need to test identity flows and promote configuration without test users,
keys, sessions, callbacks, provider effects, or weak policies reaching
production. Hosted and self-hosted Docker instances must enforce the
same boundary even when all environments share one physical database and shared
adapter infrastructure.

## Decision

An environment is a mandatory security and data boundary within one customer
organisation. Each organisation starts with `development`, `staging`, and
`production` environments. Names can be displayed differently, but immutable
environment identifiers and kinds drive policy.

An organisation has one shared end-user pool **per environment**. Applications
within that environment share its user pool and consent model; applications in
another environment do not share users, credentials, sessions, grants, or
end-user organisations.

Management identities and customer-organisation memberships remain outside the
environment boundary. An administrator selects an environment after selecting a
customer organisation, and every environment-owned action rechecks their
organisation role and environment-specific restrictions.

### Environment-Owned Data

The following belong to exactly one customer organisation and environment:

- application registrations and public/client identifiers;
- users, profiles, identity links, credentials, factors, recovery artifacts,
  devices, sessions, grants, consent, and risk state;
- end-user organisations, memberships, roles, groups, and invitations;
- OAuth/OIDC issuers, authorization records, codes, tokens, signing/encryption
  key rings, and revocation state;
- redirect, logout, CORS, origin, domain, branding, and hosted-page settings;
- social, enterprise, directory, email, SMS, webhook, queue, object-storage,
  secrets, risk, CAPTCHA, and other provider instances/bindings;
- API keys, machine clients, service accounts, action hooks, and webhook
  subscriptions;
- import/export jobs, custom schemas, usage, environment audit events, and
  environment-scoped policy/configuration; and
- outbox, idempotency, replay, rate-limit, cache, and scheduled-job state derived
  from any of the above.

Customer-wide policy defaults, administrator memberships, billing, and the
environment catalogue can live at organisation scope. Their resolved effective
versions are recorded when an environment operation needs deterministic policy.

Applications shown as one product across environment tabs are related by an
optional organisation-owned lineage identifier. Every environment still has a
distinct application registration, client identifiers, credentials, callbacks,
issuer binding, consent records, and users. A lineage identifier is navigation
and promotion metadata, not cross-environment authority.

### Credentials, Keys, Domains, and Providers

- Cryptographic keys and reusable secrets are generated independently in each
  environment and never promoted or reused.
- Client IDs, API-key prefixes, key IDs, token issuers, and public identifiers
  encode or resolve to one environment and are rejected elsewhere.
- A token, code, session, cookie, interaction, invitation, or recovery artifact
  issued in one environment is invalid in every other environment.
- Verified domains and certificates are bound to one issuer/environment. A
  hostname cannot be active in two environments simultaneously.
- Redirect and logout URIs, trusted origins, and mobile/native bindings are
  separately reviewed and stored per target environment.
- Provider instances and secret references are environment-specific. Promotion
  can request a compatible target binding but cannot copy the source credential.
- Mock, sandbox, file-system, console, and test-capture adapters are prohibited
  in production unless a provider definition explicitly passes a production
  security review. Production startup and binding changes fail closed.
- Queue topics, object prefixes/buckets, cache keys, rate-limit partitions,
  secret paths, provider account references, and observability attributes include
  trusted environment scope.

Production policy may be stricter than customer defaults. Promotion cannot
weaken platform production minimums for password, MFA, redirect, TLS, provider,
residency, retention, or signing-key controls.

### Database Enforcement

Every environment-owned row stores `customerOrganisationId` and `environmentId`,
even when the environment identifier is globally unique. Composite foreign keys
and unique indexes carry both ownership dimensions where supported.

Repository methods require the `TenantContext` from ADR-0012 and predicate on
organisation and environment in the same query as the resource ID. Joins,
pagination cursors, uniqueness checks, upserts, deletes, exports, and background
jobs follow the same rule. There is no implicit "current production" database
default.

SQLite and PostgreSQL schemas implement equivalent logical invariants. Future
hosted installations may place production environments in different databases
or regional shards, but physical separation supplements rather than replaces
logical scoping.

### Configuration Promotion

Promotion is an explicit, versioned, asynchronous operation that copies eligible
configuration through the public domain model, not database rows.

1. The administrator chooses a source snapshot and target environment.
2. The platform produces a dry-run plan with additions, changes, removals,
   conflicts, unsupported capabilities, secret/provider requirements, and
   production-policy failures.
3. The administrator reviews the plan, supplies or selects target secrets and
   provider instances, completes required step-up/approval, and confirms an
   idempotent operation.
4. The platform checks the target configuration version and permissions again,
   applies an atomic unit where possible, records partial external provisioning
   for reconciliation where not, and emits a complete audit result.

Promotable data includes policy templates, role definitions, custom attribute
schemas, branding, email templates, action-hook definitions, requested scopes,
and application settings whose target-specific values have been resolved.

Promotion never copies:

- users, credentials, factors, sessions, devices, grants, consent, memberships,
  invitations, recovery or authorization artifacts;
- signing/private keys, API secrets, client secrets, provider credentials,
  webhook signing secrets, peppers, or raw secret references;
- audit history, usage, security signals, rate-limit/replay state, jobs, or
  idempotency records; or
- domain ownership, certificates, directory cursors, external provider object
  IDs, or environment-specific callback approval.

Exact callback/origin/domain values can appear in a reviewed target template,
but activation reruns target validation. Secret placeholders identify purpose
and schema only. Production-to-lower-environment export is redacted and cannot
copy production personal data or credentials.

The promotion artifact has a schema version, source/target IDs, source
configuration version, manifest, checksums, dependency order, and omissions. It
is encrypted at rest, retained for a bounded period in European storage, and
cannot be replayed against another organisation.

### Test Data, Reset, and Deletion

Development and staging provide synthetic-data tooling that clearly marks test
identities and cannot target production. The platform does not offer a shortcut
to clone production users into a lower environment.

Resetting an environment is a destructive export/delete workflow with recent
step-up authentication, explicit typed confirmation, authorization,
idempotency, retention/legal-hold checks, durable jobs, and audit evidence.
Production reset is disabled by default and requires the strongest approval
mode. Deleting a source environment never invalidates the history or rollback
records of a completed target promotion.

Customer and user exports identify the environment of every record. Data-subject
access, correction, restriction, objection, and erasure resolve the person
independently in each applicable environment; matching addresses never authorize
cross-environment action.

### Runtime and Deployment Rules

Docker deployments receive an explicit deployment stage such as local, test, or
production, but that process setting is not customer environment context. One
production API deployment can safely serve many customer environments because
trusted request context selects the environment for every operation.

No instance-local cache, filesystem, singleton, environment variable, or
deployment binding stores the authoritative active customer environment.
Adapters receive a typed environment scope and use shared, durable,
horizontally-safe state.

## Alternatives Considered

### Share Users Across Development, Staging, and Production

Rejected. It would expose personal data to test systems and allow test
credentials, consent, sessions, or destructive operations to affect production.

### Isolate Only Credentials and Configuration

Rejected. Users, sessions, jobs, caches, provider state, and audit/export paths
would remain cross-environment confused-deputy risks.

### Clone the Entire Database During Promotion

Rejected. Row IDs, credentials, personal data, history, and provider references
are not portable configuration.

### Require a Separate Installation per Environment

Rejected as the only model. Physical installations can strengthen isolation,
but customers also need safe logical environments in one hosted or self-hosted
deployment.

### Use a Process Environment Variable as the Active Environment

Rejected. A horizontally scaled multi-tenant service handles many customer
environments concurrently.

## Security Impact

Credentials and authentication artifacts cannot cross environments. Composite
repository scoping and distinct issuer/key/provider namespaces reduce
cross-environment access and test-to-production escalation. Production
promotion and reset receive high-risk controls.

## Privacy and Residency Impact

Production personal data is not copied into less protected test environments.
Exports and rights workflows preserve environment provenance. All environment
data, promotion artifacts, jobs, logs, providers, and backups remain subject to
European processing and retention rules.

## Portability and Self-Hosting Impact

Isolation is expressed in domain, repository, and adapter contracts rather than
a particular database schema, Worker binding, or container topology. Self-hosters
can choose one shared database or stronger physical separation while passing the
same conformance tests.

## Operational Impact

Every environment multiplies key rings, credentials, provider configuration,
domain validation, migrations, monitoring dimensions, and cleanup. Explicit
lineage and promotion plans make that cost visible and prevent unsafe copying.

## Consequences

- Applications share users only with applications in the same environment.
- Administrators can move reviewed configuration without moving identities or
  secrets.
- Target-specific domains, callbacks, keys, and providers require deliberate
  setup.
- Logical isolation works in one database and can later gain physical isolation.
- Production safeguards cannot be bypassed through customer defaults.

## Validation

- Attempt every credential, token, code, cookie, key, cursor, resource ID,
  provider reference, job, and cache key across two environments.
- Run repository conformance tests with two organisations and at least two
  environments each on SQLite and PostgreSQL.
- Prove promotion manifests omit identities, secrets, history, and provider
  runtime identifiers.
- Exercise dry-run conflicts, target version races, retries, partial external
  provisioning, reconciliation, rollback, and audit.
- Verify mock/test providers and synthetic-data/reset tools cannot target
  production.
- Run the same environment and promotion suites across Docker replicas.
- Verify exports, retention, and data-subject workflows never infer identity
  across environments from matching personal data.

## Review Triggers

- A customer asks to share identities across environments.
- Environment data moves to separate databases, regions, or installations.
- A new configuration type needs promotion.
- Production needs reversible configuration deployment or staged rollout.
- A provider cannot isolate credentials or external resources by environment.
