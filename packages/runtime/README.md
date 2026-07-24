# Runtime Contracts

## Purpose and status

`@expressthat-auth/runtime` owns provider-neutral capability contracts.
RUN-002 implements time, secure randomness, and entity identifiers. Subsequent
tasks add cryptography, secret custody, key management, and shared cache state.
Later RUN tasks add queues, objects, observability, composition, and health
without changing this dependency direction.

The root export contains production-safe contracts and implementations.
Deterministic implementations are isolated under
`@expressthat-auth/runtime/testing` so deployable composition roots do not
select them accidentally.

## Time

`Clock.now()` returns an `EpochMilliseconds` value, never an unlabelled number.
Values are safe integer Unix epoch milliseconds from `0` through
`253402300799999` (the final millisecond of year 9999 UTC). `SystemClock` uses
the runtime wall clock. `ControlledClock` supports deterministic `set` and
non-negative `advance` operations in tests.

Clocks are not uniqueness, locking, lease, or ordering authorities. Shared
storage enforces those properties. Security consumers must define exact expiry
boundaries and later consult clock-health policy before issuing time-sensitive
artifacts.

## Randomness

`RandomSource.bytes()` returns a fresh `Uint8Array` for integer lengths from 1
through 65,536 bytes. `WebCryptoRandomSource` uses Web Crypto. Test code can use
`SequenceRandomSource`, which copies its inputs and outputs, enforces requested
lengths, and fails on exhaustion.

Consumers define their required entropy. Bearer secrets require at least 256
bits under ADR-0009; an entity UUID is never accepted as a bearer secret.

## Password hashing

`PasswordHasher` exposes asynchronous hash and verify operations with stable
adapter, algorithm, and policy metadata. The result is `PasswordHash`, whose
JSON form is always redacted and whose PHC text requires the explicit
`encodedForStorage()` operation.

The native and portable Argon2id implementations live in the production
`@expressthat-auth/password-argon2` provider package. Both use the injected
`RandomSource` for 16-byte salts, enforce the accepted Argon2id policy before
expensive verification, produce identical PHC output for identical input and
salt, cross-verify, and pass the same contract plus RFC 9106 vector.

## Cryptographic capabilities

`SigningProvider` signs exact bytes using an opaque handle, key ID, explicit
purpose, and allow-listed `RS256` or `ES256` algorithm. Verification uses public
`SigningKeyMetadata`; it never needs a private handle.

`AuthenticatedEncryptionProvider` exposes purpose-bound `A256GCM` encryption
and decryption with mandatory additional authenticated data. Ciphertext carries
its algorithm, key ID, and nonce. Key handles are bounded opaque values whose
JSON representation is always redacted.

The contracts deliberately do not expose private keys or silently choose
algorithms. Current tests use isolated ephemeral RSA keys and a published
AES-256-GCM vector; no process-generated key is permitted in deployable
composition.

## Key management

`KeyManagementService` is the runtime-neutral lifecycle facade above low-level
custody. It selects an active key by ring, purpose, and algorithm; signs and
verifies exact bytes; wraps and unwraps ephemeral key material with authenticated
context; rotates with an expected ring version; retires only keys already in
the retiring state; and publishes a safe public key set.

Key rings and lifecycle versions are bounded value objects. Managed metadata
can contain a redacting custody handle and the complete
`creating -> staged -> active -> retiring -> retired -> destroyed` lifecycle,
plus the terminal compromised state. Published keys use a closed RSA or P-256
shape containing only `alg`, `kid`, `kty`, `use`, and required public members.
Custody handles, internal ring metadata, timestamps, and private JWK members are
not representable in the published type.

Rotation results expose the new active key and optional retiring predecessor.
Optimistic ring versions make concurrent work fail with a conflict rather than
silently creating multiple active keys. AES-256-GCM wrapping requires
additional authenticated data so software custody can bind encrypted key
material to its environment, issuer, ring, purpose, algorithm, key ID, and
record version.

The conformance implementation is test-only and uses ephemeral Web Crypto keys.
It proves RS256/ES256 signing, RFC 7638-shaped SHA-256 key identifiers, safe
publication, overlap, retirement, stale-version rejection, algorithm and
purpose confusion rejection, AES-GCM wrapping, tamper detection, and redacted
errors. Deployable adapters must keep private keys behind non-exportable or
encrypted custody and pass the additional outage, audit, residency, recovery,
and multi-instance suites required by ADR-0007 and OPS-011.

## Secret storage

`SecretStorageProvider` makes creation, explicit version lookup, purpose-bound
resolution, optimistic rotation, and disablement separate asynchronous
capabilities. A `SecretReference` is an opaque custody locator whose JSON form
is redacted; a `SecretVersion` is a positive integer suitable for concurrency
checks and stable metadata.

Callers supply `SecretMaterial`, which copies its input, returns only defensive
copies through the deliberately named `copyForProvider()` boundary, serializes
as a redaction marker, and can overwrite its retained bytes through
`destroy()`. JavaScript cannot guarantee that engines immediately erase every
transient copy, so callers still minimize lifetime and destroy values promptly.
Management APIs will accept material only on write paths and never expose the
runtime resolution operation.

Version metadata records active, superseded, and disabled states plus creation,
replacement, rotation, and disablement instants. Rotation uses an expected
current version so adapters cannot silently overwrite a concurrent change.
`SecretStorageError` exposes only a stable operation, code, and retryability;
references, provider diagnostics, and material cannot enter its message or JSON
form.

The in-memory implementation used by the conformance suite is test-only. It
demonstrates lifecycle and redaction behavior but cannot be selected by a
deployable composition root. Production custody adapters arrive under OPS-010
and must additionally prove access control, audit, residency, outage behavior,
and durable multi-instance semantics.

## Cache and rate-limit state

`CacheStateProvider` combines expiring byte values and atomic integer counters
behind a provider-neutral asynchronous contract. It supports unconditional
put, lookup, optimistic compare-and-set, optional version-checked deletion,
atomic increment, and health reporting. Versions are positive integers, the
exact expiry instant is expired, and counter overflow is an explicit error.

A `CacheKey` can only be created from a `CacheScope`. The scope contains a
trusted customer-organisation ID, environment ID, optional application ID,
purpose, and policy version. Length-prefixed encoding prevents ambiguous
component joins. Keys, scopes, and byte values serialize as redaction markers;
provider-facing values are available only through deliberately named copy
methods. The later trusted request-context task must construct scopes from
verified routing and membership, never raw request headers.

Every operation carries one explicit outage policy:

- `deny-request` is for security and abuse controls that must fail closed.
- `query-authoritative-source` bypasses acceleration only by consulting the
  durable system of record.
- `reject-operation` returns an availability failure without making an access
  decision.

Adapters report failures; they do not interpret these policies. Domain services
must apply the selected behavior and emit the required operational or security
telemetry. There is deliberately no generic fail-open mode.

The conformance adapter is test-only and can share one synthetic backend across
replicas. Deployable adapters must provide distributed atomicity, consistent
expiry, health, residency-aware placement, and multi-instance semantics.
Process-local caches are limited to immutable build-time data and must never
become an authorization, revocation, rate-limit, or tenant-isolation authority.
Cache scope is independent of database placement, so the same contract supports
shared, per-organisation, and hybrid database deployments.

## Durable queues

`DurableQueueProvider` defines provider-neutral publication, competing-consumer
receive, visibility leases, lease renewal, acknowledgement, scheduled retry,
explicit dead-lettering, and health operations. Its declared delivery guarantee
is at least once. Exactly-once effects are not claimed: every handler must use a
persisted idempotency or effect ledger at its real side-effect boundary.

Published messages contain a typed job ID, queue, message type, schema version,
scheduled and optional expiry instants, bounded maximum delivery attempts,
explicit data classifications, a bounded redacting payload, and an
idempotency key with an explicit retention expiry. Equivalent publication
retries return the existing job identity. Reusing a live key for different
semantic input is a conflict, and retention cannot expire before the scheduled
message or its message expiry.

`QueueScope` always carries a trusted top-level customer-organisation ID.
Environment is optional for management-plane work; application requires an
environment. The scope is part of provider partitioning and generic
serialization is redacted. A consumer must treat message bytes as untrusted,
decode them with a version-specific bounded schema, verify the
integrity-protected persisted context created by the jobs layer, reload current
resources and authorization where required, and reject any scope mismatch.

Receive returns a message with a single-use lease receipt containing delivery
attempt, token, and expiry. A lease token must be checked atomically for renew,
acknowledge, retry, and dead-letter operations. Abandoned leases become
eligible for redelivery; stale workers cannot complete work after another
replica acquires it. Retry is explicitly scheduled and becomes dead-lettered
after the bounded final attempt. Payload expiry and idempotency retention use
the exact-instant-is-expired convention.

The conformance implementation is test-only. A shared synthetic backend proves
competing replicas, abandoned-work redelivery, stale-token rejection,
idempotent publication, semantic conflicts, delayed work, bounded retries,
acknowledgement, explicit and automatic dead-lettering, expiry, health, and
outage behavior. Deployable adapters must additionally prove durable
acceptance, atomic lease transitions, backpressure, fairness, recovery,
dead-letter operations, rolling message-version compatibility, and
residency-aware storage and processing. Hosted queues remain in approved
European infrastructure; self-hosted operators choose and operate their own
queue location and guarantees.

## Object storage

`ObjectStorageProvider` defines streaming put and get, optimistic versioned
delete, health, and short-lived signed read/write access. `ObjectBody` exposes
an `AsyncIterable<Uint8Array>` so large imports, exports, evidence bundles, and
archives do not require whole-object process memory or local durable files.

Every write supplies a trusted organisation/environment/application scope,
redacting traversal-safe object key, media type, one or more data
classifications, exact content length, SHA-256 checksum, encryption mode,
retention expiry, and selected residency policy. A missing expected version is
create-only; replacement names the current opaque version. Adapters must verify
length and checksum before committing success and return actual version,
classification, encryption, retention, and storage/processing residency
metadata.

Retention expiry uses the exact-instant-is-expired convention. It is the
automatic deletion deadline, not a legal-hold or minimum-retention lock.
Governance tasks later coordinate early erasure, legal obligations, backup
tombstones, and verified lifecycle deletion without weakening this per-object
deadline.

Signed object URLs are bearer credentials. Their value is available only
through `valueForClient()` and generic serialization is redacted. Access is
bounded to fifteen minutes. Read access binds key, scope, and optional version.
Write access additionally binds checksum, length, media type, classification,
encryption, object expiry, required residency, and optional expected version;
an adapter must not issue an unconstrained upload URL.

The conformance adapter is test-only. It proves chunked streaming, defensive
copies, tenant namespaces, create-only and optimistic replacement, historical
version reads, checksum and length rejection, exact expiry, deletion conflicts,
signed-access limits and redaction, constrained signed writes, policy-selected
residency, health, and normalized outage errors. Production adapters must also
prove atomic commit, multipart failure cleanup, encryption/key custody,
provider-side checksum enforcement, lifecycle deletion, backup/replication
location, signed-request binding, restore, and multi-instance behavior.

Hosted non-public objects require verified European storage and processing.
Self-hosted operators may select `operator-managed`; that accurately reports
their chosen location without inheriting hosted EU or GDPR claims.

## Observability

`ObservabilityProvider` defines structured operational logs, metric points,
traces, span events, and health without accepting free-form log messages,
objects, exceptions, request bodies, headers, cookies, SQL parameters,
environment values, credentials, or secrets.

Attributes can only be created from the central `TELEMETRY_FIELDS` registry.
Each field declares classification, allowed sinks, cardinality, and a typed
serializer. Values use closed enums or validated value objects for operation
codes, parameterized route templates, correlation IDs, status codes, and
non-reversible pseudonymous tenant references. Arbitrary strings cannot enter a
registered typed field. Attribute sets enforce per-sink allow-lists, duplicate
rejection, and bounded field counts. Only registry fields explicitly marked
low-cardinality are available to metrics; correlation and pseudonymous tenant
references are restricted to logs and traces.

Operational event names reject the `audit` namespace. This provider is not an
audit sink: durable audit records use a separate domain and storage boundary
with actor, subject, tenant, purpose, immutable facts, retention, and export
rules. Emitting a diagnostic log never satisfies an audit requirement.

Logs require timestamp, severity, correlation, registered event name, and a
message-free attribute set. Metrics require finite values, registered labels,
kind, unit, and observation time. Traces use exact-size trace/span IDs,
correlation, optional parent context, typed events, and an explicit terminal
status; error spans require a safe error code and completed spans reject later
mutation.

The conformance implementation is test-only. It proves sink separation,
low-cardinality metrics, personal-data pseudonymization, raw-string and forged
descriptor rejection, audit separation, route templating, trace correlation,
span lifecycle, metric validation, health, and redacted errors. Production
adapters must redact before every SDK/export boundary, bound buffers and
backpressure, avoid telemetry failure changing authorization outcomes, and
prove European routing, access, and retention for hosted non-public telemetry.
Self-hosted operators control their collectors, destinations, regions, and
retention.

## Identifiers

`UuidV7Generator` combines an injected clock with ten bytes from an injected
secure random source and sets the RFC 9562 version and variant fields. The
canonical persisted value is a lowercase hyphenated UUIDv7 represented by
`EntityId`.

Public identifiers use `PublicEntityId` and the immutable registry:

| Prefix | Resource |
| --- | --- |
| `app` | Application |
| `env` | Customer environment |
| `evt` | Event |
| `job` | Durable job |
| `org` | Management/customer organisation |
| `uorg` | End-user organisation |
| `usr` | User |

The distinct `org` and `uorg` prefixes prevent trust-plane confusion.
Prefixes are checked before UUID parsing and round-trip losslessly. Public IDs
are locators, not authorization. UUIDv7 exposes approximate creation time, so
existence-sensitive endpoints still use authorization and non-disclosing
responses.

## Security and portability

Generation requires no central sequence and works across Node/Docker replicas.
Randomness, not local monotonic state, provides uniqueness when clocks repeat or
move backwards. SQLite and PostgreSQL will store the same canonical UUID text
and integer millisecond values.

The package contains no process environment access, tenant state, provider SDK,
private-key store, or cross-request cache. Hosted operators monitor clock drift,
random-source health, and custody adapters. Self-hosted operators control their
Docker host and infrastructure and own the resulting security, availability,
recovery, region, and compliance.

## Development

```bash
pnpm --filter @expressthat-auth/runtime typecheck
pnpm --filter @expressthat-auth/runtime test
pnpm --filter @expressthat-auth/runtime test:coverage
pnpm --filter @expressthat-auth/runtime test:types
```
