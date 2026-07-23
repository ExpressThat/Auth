# Platform Data Classification and Handling Standard

- **Status:** Binding baseline
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Security, privacy, and data engineering
- **Decision:** ADR-0016

## 1. Classification Model

Every first-party field, event member, file, object, queue payload, cache entry,
log attribute, metric label, trace attribute, test fixture, backup element,
export member, and provider value has a declared classification before release.
Unknown data defaults to **Confidential**, is not logged or exported, and cannot
be used as a metric label until classified.

Classes can overlap. Apply every relevant rule and use the most protective rule
when they conflict:

| Class | Meaning |
| --- | --- |
| **Public** | Intentionally published without authentication |
| **Internal** | Non-public operational data whose disclosure has limited impact |
| **Confidential** | Tenant, platform, security, or business data requiring authorized purpose |
| **Personal** | Information relating or reasonably linkable to a natural person |
| **Credential** | A verifier, bearer artifact, or authentication material whose disclosure enables attack or offline analysis |
| **Secret** | Plaintext/high-authority material that grants access, decrypts data, signs artifacts, or configures privileged infrastructure |

`Credential` and `Secret` are not synonyms. A password hash is a credential that
must be strongly protected but can be verified without recovering a password. A
plaintext client secret or signing private key is a secret. A session token is a
credential and a secret while presented; its stored keyed hash remains a
credential. Personal data can also be confidential, credential, or secret.

Data is classified by content and possible use, not by its table, JSON property
name, encryption state, or whether an identifier looks opaque. Derived values,
indexes, replicas, caches, analytics, and backups inherit the source class unless
an approved privacy analysis proves irreversible anonymisation.

## 2. Handling Rules

| Rule | Public | Internal | Confidential | Personal | Credential | Secret |
| --- | --- | --- | --- | --- | --- | --- |
| Access | Anyone for intended publication | Workforce/service need | Explicit role, tenant, environment, and purpose | Purpose/role plus data-subject/controller rules | Narrow auth/security services and approved operations | Least-privilege service/custody operation only |
| Transit | HTTPS for integrity | Authenticated encrypted channel | Authenticated encrypted channel | Authenticated encrypted channel | Authenticated encrypted channel; never URL/query | Authenticated encrypted channel; never URL/query |
| Storage | Integrity/version controls | Approved European store | Encrypted approved European store | Encrypted approved European store; minimise/pseudonymise | Hash/keyed hash where verification permits; otherwise purpose encryption/custody | Secret/KMS adapter, encrypted and reference-only in ordinary database |
| Application logs | Allowed if deliberate and bounded | Structured and useful only | Identifier/redacted summary only | Pseudonymous/minimal; no raw value by default | Never | Never |
| Metrics/traces | Low-cardinality only | Low-cardinality only | No raw values or tenant names | No raw/high-cardinality person identifiers | Never | Never |
| Browser/client | Public endpoint/asset | Only when client needs it | Only authorized minimum; no privileged configuration | Authorized subject/application minimum and consent | Only one-time/intended protocol delivery; protect from JS where possible | Only deliberate one-time secret creation; never frontend build/storage |
| Ordinary tenant export | Yes where relevant | Documented operational metadata | Yes when tenant-owned/authorized | Yes for controller scope and user rights | Non-reusable metadata only; reusable material excluded | Never |
| Protected migration export | Yes | Yes where needed | Yes | Authorized/minimized | Eligible password hashes only under target-bound high-risk workflow | No platform/custody secrets; customer secret transfer requires a separately approved capability |
| Test fixtures | Safe real public data or synthetic | Synthetic/default | Synthetic/redacted | Synthetic, never production data | Published vectors or generated test-only values | Test-only values impossible to use in production |
| Support display | Public view | Need-based | Redacted and permissioned | Minimum masked view; reveal requires purpose/permission | Metadata only, never reusable value/hash | Never |
| Deletion | Publication lifecycle | Operational schedule | Controller/contract schedule | Purpose, rights, legal hold, and audit rules | Revoke immediately, purge on lifecycle schedule | Revoke/rotate immediately, destroy after safe overlap |

Encryption is defense in depth and does not lower classification. Keys are
separate from ciphertext and scoped by plane, customer, environment, and
purpose where applicable. Searchable/indexed personal or confidential fields
use purpose-specific normalized values; any blind index remains classified
because it enables correlation or guessing.

## 3. Class Details and Examples

### Public

Examples include approved product documentation, OpenAPI releases, public
frontend assets, OAuth/OIDC discovery, public JWKS members, supported public
algorithms, public application client identifiers, and deliberately published
provider capability schemas after redaction.

Public values still require integrity, cache/version control, anti-injection
encoding, and review. Organisation existence, customer email domains, internal
hostnames, feature rollout, health dependency detail, and public-looking UUIDs
are not automatically public.

### Internal

Examples include schema/migration versions, non-sensitive build metadata,
aggregate capacity metrics, opaque request/correlation IDs, feature identifiers,
and redacted service topology.

Internal data is not returned by public endpoints. Request IDs become Personal
or Confidential when linked to a person, tenant, security event, or detailed
trace. Internal diagnostics must not reveal dependency addresses,
configuration, provider handles, or tenancy.

### Confidential

Examples include customer configuration, unverified domain challenges, role and
policy definitions, application callbacks before publication, provider
non-secret configuration, audit/security events, usage, billing metadata,
idempotency records, queue/job state, cursor contents, source maps, and detailed
operational diagnostics.

Confidential values use explicit authorization, tenant/environment scope,
encrypted European storage, safe field-level API schemas, and bounded retention.
They do not enter log messages; safe identifiers or normalized error codes can
be separate classified fields.

### Personal

Examples include names, email/phone/postal addresses, profile/custom attributes,
IP addresses, precise location, device/browser identifiers, upstream identity
subjects, user/end-user-organisation membership, consent, authentication and
security history, support activity, and linkable pseudonymous identifiers.

Special-category, criminal-offence, child, biometric-template, or similarly
sensitive data is prohibited in generic profile/custom attributes by default.
Supporting it requires an explicit purpose, legal/privacy review, stronger
access and retention controls, user/customer disclosure, and updated threat
model.

Personal data is purpose-limited and minimized. APIs, tokens, hooks, providers,
logs, analytics, support views, and exports receive only fields required for
their current purpose. Matching personal data never links management/end-user,
customer, or environment identities automatically.

### Credential

Examples include password hashes, stored keyed hashes of sessions/API keys/
refresh tokens/recovery codes, passkey public keys and credential identifiers,
authorization codes, bearer tokens, assertions, one-time links, MFA verification
state, token-family/replay records, and protected credential-migration packages.

Credential values:

- never appear in logs, traces, analytics, error details, ordinary exports,
  support screens, URLs, or test snapshots;
- use purpose and plane separation, short lifetimes/revocation, constant-time
  comparisons where applicable, and replay controls;
- are not cached in process across requests;
- are redacted before generic serialization or provider error handling; and
- trigger incident response, revocation, and rotation on suspected disclosure.

Public passkey keys and public JWKs do not directly authenticate without the
corresponding private key, but remain Credential when they are account-linked
and may support tracking or offline analysis. Published issuer JWKS is Public;
the internal key record and custody handle are Confidential/Credential.

Password hashes are excluded from ordinary exports. An eligible migration export
requires step-up, explicit protected-export permission, dual authorization for
hosted production, target public-key encryption, short expiry, complete audit,
and compatibility reporting. It never includes peppers or encryption keys.

### Secret

Examples include plaintext passwords during verification, session/access/
refresh/API/client/provider secrets while presented, TOTP seeds, recovery codes
before hashing, private signing/encryption keys, peppers, cookie/context/
cursor/webhook keys, database credentials, deployment tokens, KMS handles when
usable as authority, and backup master keys.

Secrets:

- exist in plaintext only for the shortest operation and are never retained in
  ordinary application objects longer than needed;
- use write-only API/form fields and are never echoed after validation;
- are stored as a one-way verifier when recovery is unnecessary, otherwise
  through a secret/key custody adapter with purpose-bound encryption;
- are injected at runtime, never embedded in source, images, frontend bundles,
  build caches, generated specifications, migration files, or ordinary
  configuration;
- are independently scoped and rotated with safe overlap where necessary;
- cannot fall back to a weaker provider or local default; and
- are never included in customer/user exports, logs, traces, metrics, analytics,
  support screens, crash dumps, or diagnostic bundles.

Non-exportable platform signing keys, peppers, deployment master keys, and
operator credentials are never customer data-transfer artifacts. Customer-owned
provider secrets are re-entered at a destination by default. Any future
target-encrypted secret-transfer feature needs separate product authorization,
custody, threat, recovery, and provider-compatibility decisions.

## 4. Storage and Encryption

- All non-public hosted data is stored and backed up in approved European
  locations; DEC-018 maps each path.
- Database access uses least-privilege roles and encrypted connections.
- Storage encryption uses managed volume/database encryption plus
  application-level purpose encryption for recoverable high-impact values.
- Secret values in provider/application configuration are replaced by opaque,
  versioned secret references. The ordinary database stores safe metadata only.
- Passwords use versioned Argon2id. Random bearer credentials and recovery codes
  use keyed hashes when the original never needs recovery.
- Private signing/encryption keys remain behind custody handles; portable
  software custody uses envelope encryption per ADR-0007.
- Object exports use per-object data keys, authenticated encryption, checksums,
  short-lived delivery authorization, and deletion verification.
- Backups inherit every contained class. Backup encryption keys and access are
  separated from application/database credentials.
- Local SQLite and developer object/file adapters contain synthetic/local data
  only, have restrictive file permissions, are ignored by version control, and
  are forbidden in production profiles where their guarantees are insufficient.

## 5. Logging, Errors, and Observability

Structured logging accepts only a central allow-list of field descriptors with a
class and redaction strategy. Free-form objects, request/response bodies,
headers, cookies, tokens, provider payloads, SQL parameters, environment
variables, and exceptions are not serialized automatically.

Allowed routine fields include safe request/correlation IDs, operation IDs,
coarse result/error codes, duration buckets, runtime profile, and pseudonymous
tenant/environment/resource references where operationally required. Personal
or tenant identifiers are separate restricted fields with shorter access and
retention.

Redaction occurs before data crosses into logging, tracing, error tracking,
audit-streaming, or provider SDKs. A downstream processor is not trusted to
repair an upstream leak. Error responses contain safe problem details only.
Security tests use canary secrets/personal data and assert absence from every
captured sink.

Audit is not a debug log. It records approved security/business facts, actor,
subject, tenant/environment, purpose, safe changes, result, and correlation
without credential or secret values. Protected values are represented by
stable type, version, last characters only where safe, or a non-reversible
fingerprint specifically designed for audit correlation.

## 6. Retention and Deletion

Every data descriptor selects one retention class:

| Retention class | Rule |
| --- | --- |
| Ephemeral | Memory/request transaction only; clear references immediately after use |
| Interaction | Until one-time use or short protocol expiry, then purge/revoke |
| Active lifecycle | While the account/application/provider/resource is active and required |
| Rotation overlap | Only until all valid old artifacts and rollback windows expire |
| Short diagnostic | Minimum operational window with a platform maximum and automatic deletion |
| Security evidence | Bounded investigation/compliance window with restricted access |
| Contract/legal | Documented customer/legal obligation, legal hold, and deletion trigger |
| Anonymised aggregate | Retain only after tested irreversible anonymisation and minimum cohort controls |

The retention registry declares purpose, controller, start/expiry event, default
and maximum, storage/copies, deletion mechanism, backup behavior, legal-hold
eligibility, and evidence owner. A database row's deletion does not prove
deletion from queues, caches, objects, indexes, analytics, replicas, or backups;
the lifecycle job tracks all declared copies.

Credentials and secrets are revoked/rotated immediately when no longer needed
or suspected compromised, even when minimal audit evidence must remain.
Cryptographic erasure can satisfy deletion only when keys are uniquely scoped,
all copies are covered, and destruction is evidenced. Backup expiry is
documented to the requester; restored data reruns deletion tombstones before
serving traffic.

No team can extend retention merely because storage is cheap or data may be
useful later. Legal holds are scoped, authorized, audited, periodically reviewed,
and do not permit ordinary product use.

## 7. Export and Portability

Exports use explicit per-field descriptors rather than serializing database rows.
Each manifest lists data classes, schema versions, record counts, relationships,
checksums, omissions, retention/expiry, and compatibility.

- Public, tenant-owned Confidential, and authorized Personal data are included
  in complete logical tenant/user exports as applicable.
- Internal implementation data is included only when needed to interpret or
  restore customer-owned data.
- Credential metadata can describe factor type, creation, status, and last use,
  but reusable artifacts and verifiers are omitted from ordinary exports.
- Secret values are omitted. Manifests name required destination reconfiguration
  without revealing the value.
- The separately authorized protected migration package may contain eligible
  password hashes under the controls above. It is not the ordinary export.
- Management identity data is separated from customer administrator membership
  records as required by ADR-0013.
- Export links are single-purpose, short-lived, revocable, tenant/user bound, and
  audited; objects are encrypted and automatically deleted.

## 8. Engineering Enforcement

The runtime-neutral data-descriptor registry records for each field/type:

- classification(s), purpose, controller/processor role, and tenant scope;
- allowed API/token/event/provider/log/audit/export destinations;
- storage/encryption/indexing requirements;
- retention class and deletion behavior; and
- redaction/test fixture strategy.

API schemas, events, provider contracts, database mappings, logger fields,
exports, and deletion jobs reference these descriptors or an equally explicit
generated policy. CI rejects unclassified new boundary fields where technically
detectable.

Tests verify:

- no Credential or Secret reaches logs, traces, metrics, errors, snapshots,
  ordinary exports, support screens, or frontend builds;
- Personal and Confidential fields appear only in authorized schemas and tenant
  scopes;
- encryption/custody/hash behavior and wrong-key/purpose failures;
- export inclusion/omission, target encryption, manifests, expiry, and cleanup;
- retention transitions, legal holds, restored-backup tombstones, and all copy
  locations;
- deterministic synthetic fixtures and absence of production data; and
- identical policy on Workers, Docker, SQLite, PostgreSQL, and every adapter.

## 9. Classification Review Triggers

- A new field, schema, event, provider, log/metric/trace attribute, export, or
  storage location is introduced.
- Data is combined, derived, indexed, tokenized, anonymised, or reused for a new
  purpose.
- An adapter/provider, subprocessor, region, retention rule, or legal basis
  changes.
- Support, impersonation, analytics, risk, AI, fraud, or action-hook processing
  gains access to another data class.
- A leak, scanner finding, data-subject request, or restore drill shows the
  declared policy and actual flow differ.

