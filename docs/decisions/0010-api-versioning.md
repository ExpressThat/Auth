# ADR-0010: API Versioning and Compatibility

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** API and SDK engineering
- **Related tasks:** DEC-011, API-001 through API-018, SDK-001 through SDK-009
- **Supersedes:** None
- **Superseded by:** None

## Context

Management APIs, identity APIs, browser APIs, webhooks, SDKs, and standards-based
protocol endpoints evolve at different speeds. Customers need upgrades that do
not silently break integrations, while security fixes sometimes require behavior
to become stricter. Hono's inferred TypeScript client is useful inside the
monorepo but is not a language-neutral public compatibility promise.

## Decision

### Version Surfaces

- First-party JSON HTTP APIs begin under `/v1`.
- Management and public identity APIs publish separate OpenAPI documents even
  when both use the same major number.
- Browser same-origin APIs use `/api/v1/...` and are private to matching frontend
  releases; they still follow error and security conventions but do not promise
  third-party compatibility.
- Standards-defined endpoints retain their required paths: OAuth/OIDC discovery,
  authorization, token, UserInfo, JWKS, logout, SAML, and SCIM `/v2` are not
  placed under the product `/v1` prefix. Their compatibility follows the
  applicable specification, advertised metadata, and capability version.
- Webhook envelopes carry an explicit schema version independent of HTTP API
  versions.
- Adapter contracts and internal packages use package SemVer and are not exposed
  as public network versions.

Only the major API version appears in a URL. Compatible additions do not create
`/v1.1` paths or date-version query parameters.

### OpenAPI Releases

Every API release produces immutable OpenAPI 3.1 documents containing:

- a SemVer `info.version`;
- stable unique `operationId` values;
- the API major and release commit/build provenance;
- complete request, response, error, authentication, pagination, and header
  schemas; and
- a content digest recorded with release artifacts.

The repository keeps the last released document for every supported major.
Automated semantic comparison classifies changes before merge. Generated SDKs,
documentation, examples, contract tests, and mock servers are produced from the
exact released document, never a mutable live endpoint.

The current document is served at a stable discovery URL for convenience.
Versioned immutable documents remain available for supported and archived
releases.

### Compatible Changes Within a Major

Allowed additive changes include:

- new endpoints and optional capabilities;
- new optional request fields with behavior unchanged when absent;
- new response fields where clients are explicitly required to ignore unknown
  fields;
- additional pagination links or metadata in documented extension containers;
- new webhook event types only for subscriptions that opted into them; and
- performance or implementation changes preserving documented semantics.

Even additive changes require schema, contract, SDK, documentation, and
Workers/Docker conformance updates.

Enums are closed by default. Adding a value to a closed response enum is treated
as breaking because generated clients may exhaustively match it. A schema must
be explicitly modeled and documented as open/extensible before new values are
compatible.

### Breaking Changes

A new major is required to:

- remove, rename, or move an endpoint, method, field, header, or documented error;
- make optional input required or previously nullable output non-nullable;
- change a field type, meaning, format, unit, identifier prefix, or timestamp
  precision;
- narrow accepted input or broaden a closed output union/enum;
- change authentication, authorization scope, idempotency, pagination, ordering,
  rate-limit, or retry semantics incompatibly;
- change successful or error status codes in a way clients can observe;
- reinterpret an omitted/default value;
- change webhook delivery or signature semantics; or
- expose a previously reused `operationId` for different behavior.

Removing an accidental data leak or closing an exploitable input can be an
emergency security exception. It requires a security advisory, explicit impact
analysis, migration guidance where safe, and release notes; it is never labeled
silently compatible merely to avoid a major version.

### Deprecation and Sunset

Deprecation does not change behavior. A deprecated operation or field:

1. is marked `deprecated` in OpenAPI and all SDK/docs surfaces;
2. returns the RFC 9745 `Deprecation` header once operation-level deprecation is
   effective;
3. returns a `Link` with `rel="deprecation"` to migration documentation;
4. returns RFC 8594 `Sunset` only after an approved shutdown date exists; and
5. emits usage metrics by tenant/application without recording sensitive bodies.

After general availability, a public API receives at least 12 months between
announced deprecation and shutdown and remains available through at least two
compatible SDK release cycles. Longer contractual/LTS windows override this
minimum. Security, legal, or upstream protocol emergencies can shorten it only
with documented executive and security approval.

At sunset the endpoint returns a stable gone/version error and migration link;
its path is never reused for unrelated semantics.

### Major-Version Support

- General availability supports the current and immediately previous public API
  major for at least the deprecation minimum.
- Self-hosted release notes state which API and SDK majors each image supports.
- A new major can run beside the old major through shared domain services, but
  each handler has its own explicit contract and translation layer.
- Old majors receive security and correctness fixes, not new product capability,
  unless required for safe migration.
- Pre-GA `0.x` documents may change incompatibly, but every change still receives
  a changelog entry, regenerated SDK, migration note, and breaking-change result.

### SDK Compatibility

- Public SDKs use SemVer independently per language.
- A generated SDK major supports one or more explicitly listed API majors.
- SDK patch/minor releases cannot require an unannounced breaking API change.
- Unknown response object fields must be ignored and retained where round-trip
  behavior matters.
- Hono `hc` types are for same-revision first-party TypeScript consumers. Public
  consumers use versioned generated SDKs or OpenAPI.
- At least one non-TypeScript generated client compiles in release conformance.

### Release Gate

Each change compares its OpenAPI output with every affected supported release.
CI fails on an unapproved breaking change, duplicate or changed `operationId`,
missing descriptions/errors/security, or generated artifact drift.

An approved major change includes:

- a decision/migration record;
- dual-major routing and authorization tests;
- SDK and example migrations;
- deprecation/sunset plan for the prior major;
- equivalent Workers and Docker behavior; and
- rollback evidence.

## Alternatives Considered

### Date-Based API Versions

Rejected initially. Dates identify a release but do not clearly communicate a
compatibility boundary, and supporting many date snapshots increases test
combinations. Immutable OpenAPI release versions preserve exact history.

### Header-Only Negotiation

Rejected as the primary mechanism because routing, caching, browser diagnosis,
and customer proxies are clearer with a major path. Media-type negotiation may
still version a standards-defined representation.

### One Continuously Breaking `/v1`

Rejected. It transfers platform delivery risk to every customer and makes SDK
compatibility unverifiable.

### Hono Types as the Public Contract

Rejected because they couple customers to TypeScript, monorepo source, and a
specific server framework. OpenAPI is the language-neutral contract.

## Security Impact

Security requirements and error schemas are versioned and tested. Old majors
cannot bypass current tenant isolation or critical mitigations; when a safe fix
is unavoidably incompatible, the emergency process favors security while making
impact explicit.

Version selection comes from a validated route, never an untrusted header that
alters authorization policy. Unsupported versions fail before domain execution.

## Privacy and Residency Impact

Version telemetry records operation/application identifiers and outcome, not
request bodies, tokens, or personal fields. Retired OpenAPI documents contain
schemas and examples using synthetic data only and remain hosted in Europe.

## Portability and Self-Hosting Impact

OpenAPI, comparison tools, generated SDKs, and compatibility suites are
provider-neutral. The exact documents and supported-major routing ship with
Docker and Workers artifacts.

## Operational Impact

Dashboards show traffic by major, deprecated operation, SDK user agent, and
sunset readiness. Operators can identify remaining migration cohorts without
accessing customer payloads. Multiple majors increase routing and test cost
during overlap.

## Consequences

- Customers receive predictable compatibility and machine-readable deprecation.
- Closed enums make some apparently additive changes intentionally breaking.
- OpenAPI artifacts become release-controlled source outputs.
- Supporting two majors temporarily increases implementation and security work.
- Protocol endpoints need separate specification-aware compatibility tracking.

## Validation

- Snapshot and lint each versioned OpenAPI document.
- Run semantic breaking-change fixtures proving every rule above.
- Compile generated TypeScript and non-TypeScript clients against old/new
  documents.
- Replay previous-major contract and authorization suites on every release.
- Verify `Deprecation`, `Sunset`, `Link`, gone responses, and usage telemetry.
- Run equivalent version routing and rollback tests in Workers and Docker.

## Review Triggers

- Customer usage requires a longer LTS or more than two simultaneous majors.
- OpenAPI cannot express a public compatibility guarantee.
- An adopted protocol defines its own required version negotiation.
- SDK generators disagree materially about an additive schema change.
- Emergency security fixes repeatedly require compatibility exceptions.

## References

- [Deprecation HTTP Response Header, RFC 9745](https://www.rfc-editor.org/rfc/rfc9745)
- [Sunset HTTP Header, RFC 8594](https://www.rfc-editor.org/rfc/rfc8594)
- [OpenAPI Specification 3.1](https://spec.openapis.org/oas/v3.1.1.html)
- [Semantic Versioning 2.0.0](https://semver.org/)
