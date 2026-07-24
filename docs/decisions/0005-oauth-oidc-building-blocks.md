# ADR-0005: OAuth 2.0 and OpenID Connect Building Blocks

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security and platform engineering
- **Related tasks:** DEC-006, IAM-001 through IAM-032, SEC-007
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform is an OAuth 2.0 Authorization Server and OpenID Provider, and it is
also an OAuth/OpenID client when connecting enterprise or social identity
providers. Protocol mistakes can expose accounts, clients, tokens, and consent.
The complete issuer must run consistently in horizontally scaled Node.js
containers. A framework that relies on process-local correctness therefore
cannot be the production implementation.

No reviewed, certified authorization-server library currently provides the
required Hono/Web API architecture and product scope. We must combine
reviewed cryptographic and client-protocol building blocks with a deliberately
small local issuer implementation, then prove the complete behavior with
independent conformance suites.

## Decision

Use the following maintained, standards-focused building blocks:

| Building block | Use | Evaluated line |
| --- | --- | --- |
| `jose` | JWS, JWE, JWT, JWK, JWKS, claims validation, key import/export, and thumbprints | 6.2 |
| `oauth4webapi` | Upstream OAuth/OIDC client flows, discovery, response validation, DPoP, and JWT access-token validation where its API fits | 3.8 |
| Web Crypto and Web APIs | Secure randomness, digest operations, `URL`, `URLSearchParams`, `Request`, `Response`, and `fetch` | Supported runtime baseline |
| Hono and Zod contracts | HTTP routing, boundary parsing, documented error shapes, and OpenAPI | ADR-0004 |

Both selected protocol libraries are ESM, dependency-free, Web API based, and
support modern Node.js. Pin exact versions in the lockfile, review security
advisories and changelogs before upgrades, and rerun protocol plus runtime
compatibility suites for every upgrade.

### Locally Owned Authorization-Server Behavior

The platform owns issuer behavior that the selected libraries do not implement:

- authorization request validation and interaction continuation;
- application, redirect URI, response type, response mode, scope, resource, and
  prompt policy;
- login, consent, remembered grants, account selection, and organization context;
- authorization code creation, one-time redemption, expiry, and PKCE enforcement;
- token endpoint grant dispatch and client authentication policy;
- access, ID, refresh, device, interaction, and session token lifecycle;
- refresh-token families, rotation, reuse detection, and revocation;
- discovery metadata and JWKS publication;
- UserInfo, introspection, revocation, PAR, device authorization, and logout;
- claims, audience, subject identifier, nonce, `auth_time`, and `acr`/`amr`
  construction;
- signing-key selection and rotation orchestration around `jose`;
- transactional persistence, rate limits, security events, and audit records.

These behaviors live in runtime-neutral domain services with repositories,
clock, identifier, cryptography, queue, cache, and lock contracts. Hono handlers
only translate HTTP requests and responses. No deployment profile may bypass
the same domain and protocol test suites.

### Initial Standards Profile

The secure baseline supports:

- Authorization Code with PKCE using `S256`, for public and confidential clients;
- Refresh Token with rotation and reuse-family revocation;
- Client Credentials for machine clients;
- Device Authorization Grant with polling controls;
- OIDC Core, Discovery, UserInfo, and RP-Initiated Logout;
- OAuth metadata, revocation, introspection, resource indicators, PAR, and issuer
  identification;
- private-key JWT and client-secret authentication where appropriate;
- opaque and JWT access tokens through an application policy;
- DPoP as an application capability after its dedicated conformance gate.

Implicit Grant and Resource Owner Password Credentials are not implemented.
OAuth Security BCP deprecates the former and says the latter must not be used.
New draft features remain disabled until a versioned capability, threat review,
  built-image tests, and migration policy exist.

### Algorithms

- Use an asymmetric signature baseline supported by the selected Node.js
  versions; begin with ES256 and RS256 interoperability tests.
- Reject `none`, algorithm confusion, caller-selected algorithms, weak symmetric
  client secrets, unknown critical headers, and keys that violate policy.
- Keep the accepted algorithm set in issuer/application policy, never in request
  input.
- Treat additional algorithms as explicit capabilities. They cannot be enabled
  until test vectors pass in Node.js and the built Docker image.
- Use `jose` APIs for JOSE serialization and verification; do not implement
  cryptographic primitives locally.

## Alternatives Considered

### High-Level Certified Authorization-Server Framework

The mature Node implementation has broad certified protocol support and is a
valuable behavior reference. Adopting it would surrender important application,
tenant, storage, and contract boundaries to framework-specific behavior. It may
remain a differential reference but is not the production core.

### Implementing JOSE Locally

Rejected. Signature formats, claim validation, key conversion, algorithm
selection, and remote key handling are security-sensitive and already covered by
reviewed libraries and specification test vectors.

### One High-Level OIDC Client per Connector

Rejected as the core abstraction. A low-level portable client library makes
security checks visible and supports enterprise connectors consistently.
Higher-level connector packages may be evaluated behind adapter contracts later.

### Supporting Legacy Grants for Compatibility

Rejected. Compatibility does not justify grants forbidden by current security
guidance. Customers must migrate to Authorization Code with PKCE, Device Flow,
or an appropriate machine grant.

## Security Impact

Reviewed JOSE and client-protocol code reduces locally owned cryptographic
surface, but the issuer remains security-critical local code. Each request must
bind authorization code, redirect URI, client, PKCE verifier, resource, nonce,
user session, consent, and organization context. All tokens use purpose-specific
types, audiences, lifetimes, and replay controls.

Protocol errors use stable public codes without leaking secrets, account
existence, key material, raw tokens, or internal policy. Logs and test artifacts
must redact authorization codes, tokens, assertions, and personally identifiable
claims.

## Privacy and Residency Impact

Protocol state and tokens are processed and stored in the selected European data
region. Upstream discovery and UserInfo calls are explicit configured data
transfers and must be represented in connector privacy metadata. Conformance
fixtures contain synthetic identities only.

## Portability and Self-Hosting Impact

Hosted and self-hosted editions use the same Docker/Node.js release artifacts.
Production issuer code relies on platform contracts, not local filesystem or
process memory for correctness. Every protocol milestone must pass the same
behavioral suite directly and against the built Docker image.

Optional provider acceleration can exist behind capabilities, but it cannot
replace a portable implementation required by the self-hosted baseline.

## Operational Impact

State needed for replay prevention, rotation, and one-time redemption must use
transactional shared storage or distributed locks; no in-process state is
authoritative. Key rotation, metadata changes, and accepted algorithm changes
require staged rollout because multiple instances and both runtime artifacts may
overlap during deployment.

## Consequences

- We retain responsibility for authorization-server correctness.
- The local issuer surface is kept smaller by delegating JOSE and upstream client
  behavior.
- Deployment profiles cannot gain protocol features unless the same behavior is
  implemented and released in the shared Docker artifact.
- Exact dependency upgrades require security review and conformance evidence.
- A portable implementation requires more domain-level protocol tests than a
  runtime-specific framework wrapper.

## Conformance Strategy

1. Add RFC and OpenID test vectors for JOSE, PKCE, token claims, redirect matching,
   client authentication, refresh rotation, and negative cases.
2. Run identical black-box journeys against direct Node.js and Docker deployments.
3. Integrate the open-source OpenID Foundation Conformance Suite in CI; retain
   plan identifiers and results as release evidence.
4. Test the platform as both an OpenID Provider and a Relying Party.
5. Run OAuth Security BCP, FAPI 2.0, logout, DPoP, and extension plans when the
   related capability is implemented.
6. Pursue formal OpenID certification for hosted European deployments and the
   reproducible self-hosted release profile before general availability.
7. Differential tests may compare selected behavior with a certified Node
   implementation, but it is never the sole oracle.

## Review Triggers

- A maintained, certified issuer becomes available for the required architecture.
- A selected library drops a supported Node.js version.
- A security advisory, maintainer change, or unpatched vulnerability affects a
  selected library.
- A required algorithm differs between supported architectures.
- The OpenID Foundation updates or retires a target conformance profile.
- A new OAuth/OIDC specification reaches a maturity level proposed for default
  enablement.

## References

- [`jose` documentation and supported runtimes](https://github.com/panva/jose)
- [`oauth4webapi` documentation and certification](https://github.com/panva/oauth4webapi)
- [OAuth 2.0 Security Best Current Practice, RFC 9700](https://www.rfc-editor.org/rfc/rfc9700)
- [OAuth 2.0 Authorization Server Metadata, RFC 8414](https://www.rfc-editor.org/rfc/rfc8414)
- [OpenID Foundation Conformance Suite](https://openid.net/certification/about-conformance-suite/)
- [OpenID Connect certification](https://openid.net/certification/)
