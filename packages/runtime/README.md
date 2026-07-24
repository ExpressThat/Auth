# Runtime Contracts

## Purpose and status

`@expressthat-auth/runtime` owns provider-neutral capability contracts.
RUN-002 implements time, secure randomness, and entity identifiers. RUN-003
adds password hashing, exact-byte signatures, authenticated encryption, and key
metadata. Later RUN tasks add secrets, custody, caches, queues, objects,
observability, composition, and health without changing this dependency
direction.

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
