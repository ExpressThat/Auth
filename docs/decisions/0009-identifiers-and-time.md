# ADR-0009: Identifier and Timestamp Conventions

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Platform and data engineering
- **Related tasks:** DEC-010, FND-006, FND-007, DB-001 through DB-008
- **Supersedes:** None
- **Superseded by:** None

## Context

Multiple Docker instances create users, organizations, applications,
sessions, grants, audit events, and jobs concurrently. Identifiers must be
generated without a central sequence, index efficiently, remain portable between
SQLite and PostgreSQL, and not be mistaken for authorization secrets.

Time drives token expiry, one-time use, retention, rotation, audit order, and
optimistic concurrency. JavaScript, SQLite, PostgreSQL, JSON, JWT, and browser
APIs represent it differently, so implicit conversion would cause security and
compatibility errors.

## Decision

### Persisted Entity Identifiers

Use RFC 9562 UUIDv7 for first-party persisted entity primary keys and event/job
identifiers.

- Generate IDs in application code through an injected `IdentifierGenerator`
  using cryptographically secure randomness.
- Store the canonical lowercase hyphenated UUID string.
- SQLite uses constrained `TEXT`; PostgreSQL also uses canonical text initially
  so schema behavior and lexical ordering are identical.
- Foreign keys use the same representation and collation.
- Validate version, variant, length, case, and canonical round-trip at every
  untrusted boundary.
- Database defaults and auto-increment sequences do not generate domain IDs.

UUIDv7 provides useful approximate insertion order but not a global sequence.
Randomness provides uniqueness across instances. Process-local monotonic behavior
may improve same-millisecond ordering but is never used for correctness,
authorization, pagination uniqueness, or distributed coordination.

Every deterministic sort includes the identifier as a final tie-breaker. Code
must not extract the UUID timestamp as the authoritative creation time.

### Public Identifier Form

Public APIs wrap the canonical UUID in a stable type prefix:

```text
usr_019c...
org_019c...
uorg_019c...
app_019c...
env_019c...
evt_019c...
job_019c...
```

The complete prefix registry lives in the identifiers package. Prefixes are
lowercase ASCII, immutable after release, and checked before UUID parsing.
Management organizations and end-user organizations use different prefixes to
prevent trust-plane confusion.

Database records store the raw UUID, not the prefixed presentation. API schemas,
logs, events, and SDK types use the prefixed form unless a protocol defines a
different identifier. Conversion is lossless and centralized.

Public IDs are opaque locators, not secrets or proof of tenant membership.
UUIDv7 reveals approximate creation time. That is accepted for ordinary resource
identifiers and documented; resources whose existence is sensitive use generic
responses and authorization rather than relying on unpredictable IDs.

### Identifiers That Are Not Entity IDs

Do not use UUIDs for bearer authority or protocol values:

- sessions, authorization codes, refresh tokens, reset links, email links,
  interaction handles, and API secrets use independently generated random values
  with at least 256 bits before encoding and are stored only as keyed hashes
  where retrieval is unnecessary;
- OAuth `client_id` is a separate stable, high-entropy public identifier;
- client secrets and API keys have a public lookup prefix plus a separately
  generated secret portion;
- OIDC `sub` is issuer/application policy output and can be pairwise; it is never
  the platform user ID by accident;
- `jti`, nonce, state, PKCE, SAML IDs, WebAuthn challenges, and idempotency keys
  follow their protocol-specific entropy and comparison rules;
- signing-key `kid` follows ADR-0007 and RFC 7638.

No token or secret parser accepts an entity ID as a compatible fallback.

### Clock Contract

All domain code reads time through an injected UTC `Clock`. It returns an integer
Unix epoch millisecond instant. Tests use controlled clocks; production adapters
use the runtime wall clock and expose drift monitoring.

The clock is not a uniqueness service. Distributed locks, leases, one-time use,
and optimistic concurrency are enforced in shared storage with explicit expiry
and compare-and-swap behavior.

### Database Time Representation

Store instants as signed 64-bit Unix epoch milliseconds:

```text
created_at_ms
updated_at_ms
expires_at_ms
revoked_at_ms
```

- SQLite uses `INTEGER`.
- PostgreSQL uses `BIGINT`.
- Drizzle codecs expose a branded integer-millisecond domain type.
- Values must be finite safe integers within the platform-supported date range.
- Nullable instants use SQL `NULL`; zero, empty strings, and maximum integers are
  not sentinels.
- `created_at_ms` is immutable. Mutations set `updated_at_ms` from the same
  operation clock value.
- Security comparisons define inclusive/exclusive boundaries explicitly; expiry
  is normally invalid when `now >= expiresAt`.

Integer milliseconds avoid database/session timezone behavior and preserve the
same value through SQLite, PostgreSQL, Node, and JSON conversion.
Database-native reporting views may convert them to timestamps but are not the
authoritative stored value.

### API Time Representation

Public JSON represents an instant as strict RFC 3339 UTC with exactly three
fractional digits and `Z`:

```text
2026-07-23T22:15:03.042Z
```

OpenAPI uses `type: string`, `format: date-time`, plus the stricter documented
pattern. Inputs with local offsets, missing zones, excessive precision, leap
second spellings unsupported by the runtime, or non-canonical forms are rejected
unless a protocol explicitly requires a broader grammar.

Durations are named with their unit (`timeoutMs`, `lifetimeSeconds`) and use
bounded integers. Calendar-only values use `YYYY-MM-DD`. User display time zones
use validated IANA zone identifiers stored separately; local date-time text is
never persisted as an instant.

### Protocol Time

- JWT/OAuth NumericDate claims use integer epoch seconds as required by their
  specifications. Convert explicitly from the operation instant and calculate
  expiry from bounded integer seconds.
- Cookie dates use HTTP-date formatting derived from the same instant.
- WebAuthn, SAML, SCIM, email, and webhook formats use dedicated codecs with
  round-trip and boundary tests.
- Database retention and queue scheduling keep millisecond instants even when an
  adapter's external API has coarser precision.

No shared utility guesses a unit from numeric magnitude.

### Ordering and Pagination

Cursor pagination encodes the full declared sort tuple, including the final
entity ID. Creation-order cursors normally use:

```text
(created_at_ms, id)
```

UUID lexical order can optimize insertion and act as a tie-breaker, but
`created_at_ms` remains the business timestamp. Audit streams use
`(occurred_at_ms, event_id)` and document that wall-clock order is not causal
order across distributed operations.

### Clock Rollback and Drift

Identifier generation continues safely during wall-clock repetition or rollback
because UUID randomness remains authoritative for uniqueness. It emits a metric
when observed time moves backward or exceeds the drift threshold.

Security operations fail closed when clock health exceeds the configured safe
bound for token issuance, assertion validation, rotation, or lease acquisition.
Read-only operations can remain available where safe. Nodes never rewrite
persisted timestamps to hide drift.

## Alternatives Considered

### Auto-Incrementing Integers

Rejected as the platform identifier because they require database coordination,
enumerate resources, complicate offline event creation, and differ across
database and tenant strategies.

### Random UUIDv4 Everywhere

UUIDv4 is sufficiently unique but causes less index locality and carries no
useful approximate order. It remains suitable inside protocol values only where
a specification expects UUID syntax and ordering is irrelevant.

### ULID

ULID is sortable and readable but has less direct database/tooling support and
non-canonical monotonic behavior across implementations. UUIDv7 is now an RFC and
fits existing UUID validation ecosystems.

### UUID as a Bearer Secret

Rejected. Resource lookup and possession authority have different entropy,
storage, rotation, disclosure, and revocation requirements.

### Native PostgreSQL Timestamp and SQLite Text

Rejected as the authoritative representation because precision, timezone
conversion, comparison, and driver behavior would differ between supported
databases.

### Microsecond or Nanosecond Domain Instants

Rejected initially. JavaScript JSON lacks an interoperable integer representation
at those ranges, target protocols are usually seconds or milliseconds, and fake
precision would not establish distributed event order.

## Security Impact

Strict prefixes prevent accidental cross-entity use but do not replace tenant and
authorization checks. Secret values use independent cryptographic randomness and
hashed storage. Explicit time units and controlled boundary semantics reduce
expiry and replay mistakes.

UUID timestamps and public creation timestamps can reveal approximate resource
age. Sensitive lookup endpoints mitigate enumeration through access control,
rate limits, and non-disclosing responses.

## Privacy and Residency Impact

Identifiers contain no names, email addresses, domain slugs, region codes, or
other personal data. Pairwise subjects prevent unnecessary cross-application
correlation. Time remains personal data when attached to user activity and
follows the data-classification and retention policies.

## Portability and Self-Hosting Impact

Generation depends only on secure randomness and a clock available in both
Node replicas. Canonical text UUIDs and integer milliseconds behave the same
in SQLite and PostgreSQL, at the cost of more storage than native compact types.

## Operational Impact

Logs can correlate prefixed public IDs without exposing secrets. Metrics track
identifier collisions (expected never), parse failures, clock rollback, drift,
and out-of-range timestamps. Operators can convert epoch milliseconds in
reporting tools through documented views.

## Consequences

- IDs are decentralized, sortable enough for indexes, and portable.
- Public prefixes improve human and type-level diagnosis.
- Approximate UUID creation time is observable.
- Text UUID storage uses more space than binary/native UUID columns.
- Millisecond precision is the platform limit unless this ADR is superseded.

## Validation

- Use RFC UUIDv7 vectors and property tests for version, variant, canonical form,
  timestamp bounds, uniqueness, and prefix round-trips.
- Generate IDs concurrently in Node processes and controlled
  same-millisecond/rollback tests.
- Round-trip min/max supported instants through domain, SQLite, PostgreSQL,
  Drizzle, JSON, OpenAPI, and protocol codecs.
- Test expiry at one millisecond before, exactly at, and after the boundary.
- Test pagination with identical timestamps and IDs spanning multiple instances.
- Prove entity IDs are rejected by token/secret parsers and vice versa.

## Review Triggers

- Database size or index measurements justify a portable binary representation.
- JavaScript and JSON adopt a broadly interoperable higher-precision instant.
- A protocol requires an identifier incompatible with the separate codec model.
- UUIDv7 implementation or clock rollback behavior differs across runtimes.
- Public timestamp leakage becomes unacceptable for a resource class.

## References

- [Universally Unique IDentifiers, RFC 9562](https://www.rfc-editor.org/rfc/rfc9562)
- [Date and Time on the Internet, RFC 3339](https://www.rfc-editor.org/rfc/rfc3339)
- [JWT NumericDate, RFC 7519](https://www.rfc-editor.org/rfc/rfc7519)
