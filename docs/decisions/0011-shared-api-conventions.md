# ADR-0011: Shared API Conventions

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** API and SDK engineering
- **Related tasks:** DEC-012, API-001 through API-018
- **Supersedes:** None
- **Superseded by:** None

## Context

Every management, identity, account, and internal API needs predictable errors,
pagination, retries, correlation, and concurrency behavior. Inconsistent local
choices become breaking SDK contracts and can create duplicate security actions,
cross-tenant cursors, lost updates, or information leaks.

## Decision

### Representation

- First-party API requests and responses use UTF-8 JSON and camel-case member
  names.
- Clients send `Content-Type: application/json` for JSON bodies and an
  appropriate `Accept` value. Unsupported media types return 415.
- Successful resource responses use `{ "data": ... }`; collections use
  `{ "data": [...], "page": ... }`. A successful action with no representation
  returns 204 without a body.
- Unknown request members are rejected with a field error. Unknown response
  members must be ignored by clients as defined by ADR-0010.
- Optional absent values are omitted. `null` is used only when the schema gives
  it a distinct meaning.
- Integers must remain within the declared OpenAPI bounds. Identifiers and
  instants follow ADR-0009; no endpoint guesses numeric units.
- Request-body, nesting, string, array, and multipart limits are defined per
  operation and enforced before expensive domain work.

Protocol endpoints use their standards-mandated media types and error shapes
where these rules conflict. They still share request IDs, safe logging, limits,
and tenant isolation.

### Error Envelope

Non-protocol HTTP errors use RFC 9457 Problem Details with
`Content-Type: application/problem+json`:

```json
{
  "type": "https://docs.example.invalid/problems/validation-failed",
  "title": "Request validation failed",
  "status": 422,
  "detail": "One or more values are not valid.",
  "instance": "urn:request:019c...",
  "code": "validation_failed",
  "requestId": "019c...",
  "correlationId": "019c...",
  "retryable": false,
  "errors": [
    {
      "pointer": "/profile/email",
      "code": "invalid_email",
      "detail": "Enter a valid email address."
    }
  ]
}
```

- `type` is a stable HTTPS documentation URI; it never changes meaning.
- `code` is a stable lowercase snake-case machine code within that problem type.
- `title` is stable for the type. `detail` is safe human guidance and is never
  parsed by clients.
- `status` exactly matches the HTTP status.
- `instance` identifies the occurrence but is not publicly dereferenceable.
- `errors` is present only for safe field/batch details. JSON Pointer locates a
  body member; `parameter` and `location` are used for query/header/path errors.
- `retryable` describes this occurrence, not whether repeating an unsafe request
  without an idempotency key is safe.
- Optional retry metadata includes `retryAfterSeconds` and the matching HTTP
  `Retry-After` header.

No problem contains stack traces, SQL, provider payloads, secrets, tokens,
password hashes, tenant existence, policy internals, or unredacted personal
data. Authentication, invitation, verification, recovery, and user lookup use
non-enumerating problem types where required.

Common status semantics are:

| Status | Meaning |
| --- | --- |
| 400 | Malformed syntax or header |
| 401 | Missing/invalid authentication with an appropriate challenge |
| 403 | Authenticated but not permitted; may be collapsed to 404 |
| 404 | Resource absent or intentionally concealed |
| 409 | Current state conflict or operation already in progress |
| 412 | `If-Match` precondition failed |
| 415 | Unsupported request media type |
| 422 | Structurally valid request failed field/domain validation |
| 428 | Required `If-Match` or idempotency precondition missing |
| 429 | Rate limit or abuse limit reached |
| 500 | Unexpected internal failure with generic detail |
| 503 | Explicit temporary dependency/capability unavailability |

### Request and Correlation Identifiers

- The edge/API creates a canonical UUIDv7 `X-Request-Id` for every request and
  returns it on every response. A caller cannot choose it.
- A caller may send one canonical UUIDv7 `X-Correlation-Id`; invalid or repeated
  values return 400. If absent, the server creates one and returns it.
- The request ID identifies one attempt. The correlation ID follows related
  requests, jobs, events, provider calls, and webhooks where safe.
- W3C `traceparent`/`tracestate` are validated separately for observability and
  never authorize, select a tenant, or replace business correlation.
- IDs are structured log fields after validation, never interpolated into log
  messages or storage keys without namespacing.

### Cursor Pagination

Use keyset pagination. Offset/page-number pagination is not part of public list
contracts.

Requests use:

```text
limit=25
cursor=<opaque value>
```

- The default limit is 25 and the platform maximum is 100 unless an operation
  documents a smaller bound.
- A cursor is a versioned, authenticated, base64url value created by a cursor
  codec/key adapter. It binds API major, operation, trusted tenant/environment,
  normalized filters, sort order, last complete sort tuple, and expiry.
- Cursor contents are not a public contract. Sensitive tuple values are
  encrypted as well as authenticated.
- Cursor validation occurs after trusted tenant resolution and before the query.
  Cross-tenant, altered, expired, wrong-operation, or wrong-filter cursors return
  the same safe invalid-cursor problem.
- Responses contain `page.nextCursor` when another page exists and
  `page.hasMore`. Cursors are forward-only initially.
- Total counts are omitted by default. An operation may expose an explicitly
  requested bounded/estimated count with permission and cost documented.
- Inserts/deletes between calls can change membership; stable keyset ordering
  prevents offset drift but does not promise snapshot isolation unless the
  operation explicitly binds a snapshot.

Every sort ends with the unique ID tie-breaker from ADR-0009.

### Filtering, Search, and Sorting

- Filters use explicit allow-listed query members such as
  `filter[status]=active`; each operation documents equality, ranges, repeated
  values, case, Unicode normalization, and null behavior.
- Full-text search uses a separate bounded `query` member and documents indexed
  fields. It never silently broadens into secret, credential, or cross-tenant
  columns.
- Sort uses a comma-separated allow-list; `-createdAt,name` means descending
  creation then ascending name. Unsupported fields/directions return 422.
- Server defaults are deterministic and part of the contract.
- Query parsers reject duplicate scalar parameters, excessive parameter counts,
  invalid encodings, and ambiguous bracket structures.
- Filters and sorts are compiled to repository methods; untrusted strings never
  become raw SQL identifiers or fragments.

### Idempotency

Unsafe create/action operations document whether `Idempotency-Key` is required.
It is mandatory for externally retried operations that can create a credential,
payment/metering record, invitation, export, provider mutation, deployment, or
other costly/irreversible side effect.

- Keys are 16–200 visible ASCII characters, contain no whitespace/control
  characters, and should carry at least 128 bits of caller-generated entropy.
- Scope is `(trusted tenant, environment, authenticated principal/client,
  operationId, key)`.
- Store only a keyed hash of the key in shared transactional storage.
- Atomically bind it to a canonical request fingerprint before executing.
- The fingerprint includes method, canonical path, media type, and validated
  semantic input; it excludes transport-only correlation and tracing headers.
- Same key and fingerprint returns the recorded final status, safe headers, and
  body without repeating effects.
- Same key with different input returns 409 `idempotency_key_reused`.
- A concurrent unfinished attempt returns 409 `idempotency_in_progress` plus a
  bounded `Retry-After`, or joins the result only where explicitly implemented.
- The default retention is 24 hours; operations can declare a longer window.
- A 5xx before any committed effect is not retained as final. An ambiguous or
  committed external effect remains pending reconciliation and is never blindly
  repeated.

GET/HEAD remain intrinsically safe and do not use idempotency keys. A key does
not bypass authorization, CSRF, rate limits, optimistic concurrency, or current
resource-state validation on replay.

### Optimistic Concurrency

Mutable resources have an integer `version` incremented in the same transaction
as each state change. Representations return a strong ETag derived only from
resource identity and version.

- PATCH, PUT, DELETE, and high-risk actions require `If-Match`.
- Missing required preconditions return 428.
- A non-matching or stale ETag returns 412 with the current representation only
  when the caller may safely view it.
- Repository updates include tenant, ID, expected version, and allowed current
  state in one conditional statement.
- `updatedAt` is informational and never a concurrency token.
- Batch operations define per-item preconditions and do not weaken atomicity
  implicitly.

### Rate-Limit Headers

Responses use `RateLimit-Policy` and `RateLimit` structured fields following the
current IETF HTTPAPI draft, plus `Retry-After` on 429 when a retry time is safe to
disclose.

- Headers expose only the effective client-visible policy, available quota, and
  coarse window. Internal abuse scores, IP/network classifications, tenant size,
  and other partition identities are not exposed.
- Values are hints, not authorization or a guarantee that another request will
  succeed.
- Multiple identity, tenant, client, IP, route, and global limits can apply; the
  response reports the most constraining safe policy.
- Security endpoints may deliberately return less precise information to avoid
  helping attackers.
- The implementation is isolated behind a formatter because the referenced
  field specification is still a draft; adoption is reviewed when it becomes an
  RFC or changes syntax.

### Caching

Authenticated and tenant-specific responses default to
`Cache-Control: no-store`. Public discovery/JWKS/static resources define their
own safe validators and cache policy. `Vary` is explicit. Shared caches never key
private data only by URL or an untrusted tenant header.

## Alternatives Considered

### Custom Nested Error-Only Format

Rejected in favor of RFC 9457, which already defines media type, type URIs,
occurrence IDs, extensions, and safe semantics.

### Offset Pagination

Rejected for mutable/high-volume tables because it becomes slow and produces
duplicates or gaps under concurrent writes.

### Client-Supplied Request ID

Rejected because collisions and log injection would make one attempt ambiguous.
A separate validated correlation ID preserves caller correlation.

### Last-Write-Wins Mutations

Rejected because concurrent dashboard/API edits can silently undo security and
configuration changes.

### In-Process Idempotency or Rate Limits

Rejected because instances are stateless and horizontally scaled. Correctness
uses shared adapter-backed state.

## Security Impact

Problem details are non-enumerating and redacted. Cursors are tenant-bound and
authenticated. Idempotency and ETags prevent duplicate or lost security changes.
Rate-limit metadata is deliberately coarse. None of these mechanisms replaces
authentication, authorization, CSRF, or tenant predicates.

## Privacy and Residency Impact

Request/correlation IDs and idempotency records contain no raw personal data.
Cursor payloads minimize values and encrypt sensitive tuples. All shared state,
logs, and traces remain in the selected European region with bounded retention.

## Portability and Self-Hosting Impact

Contracts use HTTP/JSON standards. Cursor signing, idempotency, rate limits, and
concurrency use adapters/repositories with deterministic conformance suites on
Workers and Docker.

## Operational Impact

Stable problem codes and request IDs improve support without leaking internals.
Idempotency and cursor records add shared storage and cleanup jobs. Keyset
pagination requires deliberate indexes for every supported filter/sort.

## Consequences

- SDKs can implement one error, retry, pagination, and concurrency model.
- Strict input parsing rejects ambiguous clients early.
- Some simple mutations require an initial GET to obtain an ETag.
- Counts and arbitrary sorts are intentionally unavailable unless designed.
- Draft rate-limit syntax needs a future compatibility review.

## Validation

- Contract-test every problem/status and safe redaction case.
- Fuzz JSON, query, cursor, ETag, correlation, idempotency, and structured-field
  parsers.
- Run concurrent idempotency and optimistic-update tests across API instances.
- Prove cursor rejection across tenant, environment, operation, filter, key
  rotation, expiry, and tampering boundaries.
- Verify pagination under concurrent insert/delete and both SQL dialects.
- Run identical HTTP suites against Workers and Docker.

## Review Triggers

- The rate-limit or idempotency drafts become RFCs or change syntax.
- SDK generators cannot model the Problem Details extensions.
- A list API requires snapshot or backwards pagination.
- Idempotency retention is shorter than an external provider uncertainty window.
- A new media type or batch protocol needs different conventions.

## References

- [Problem Details for HTTP APIs, RFC 9457](https://www.rfc-editor.org/rfc/rfc9457)
- [HTTP Semantics, RFC 9110](https://www.rfc-editor.org/rfc/rfc9110)
- [RateLimit header fields for HTTP](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/)
- [The Idempotency-Key HTTP Header Field](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/)
