# Runtime Contracts

## Purpose and status

`@expressthat-auth/runtime` owns provider-neutral capability contracts.
RUN-002 implements time, secure randomness, and entity identifiers. Later RUN
tasks add cryptography, secrets, keys, caches, queues, objects, observability,
composition, and health without changing this dependency direction.

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
or cross-request cache. Hosted operators monitor clock drift and random-source
health. Self-hosted operators control their Docker host and infrastructure and
own the resulting security, availability, recovery, region, and compliance.

## Development

```bash
pnpm --filter @expressthat-auth/runtime typecheck
pnpm --filter @expressthat-auth/runtime test
pnpm --filter @expressthat-auth/runtime test:coverage
pnpm --filter @expressthat-auth/runtime test:types
```
