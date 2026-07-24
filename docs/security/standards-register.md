# Protocol and Security Standards Register

- **Status:** Binding baseline
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Listed per register area
- **Decision:** ADR-0021
- **Review cadence:** automated change monitoring, quarterly review, and before
  every protocol/security release

## 1. Adoption Rules

The register separates maturity from product status:

| Product status | Meaning |
| --- | --- |
| **Required** | Implement and test the recorded profile before the related capability is complete |
| **Profiled** | Required only for an enabled application/deployment profile |
| **Planned** | Backlog capability; do not advertise or accept it yet |
| **Reference** | Security/interoperability guidance, not a claim of formal conformance |
| **Rejected** | Deliberately unsupported/insecure behavior |
| **Monitor** | Draft or ecosystem change under review; disabled by default |

RFCs, final OpenID/OASIS specifications, and W3C Recommendations can be
normative after profiling. An Internet-Draft, W3C Working/Candidate Draft, editor
draft, or implementer's draft never silently becomes production behavior. It
needs an exact version, capability flag, threat review, interoperability tests,
migration policy, and ADR approval.

The implementation profiles a standard rather than claiming every optional
feature. Each protocol package records:

- supported operations, extension points, algorithms, claims, bindings, errors,
  limits, and deliberately unsupported features;
- exact library/spec/test-suite versions and relevant errata;
- positive, negative, malformed, replay, mix-up, downgrade, and cross-context
  vectors;
- Docker image and multi-replica results plus external conformance evidence; and
- security/privacy/residency review owner and next review date.

Later documents that obsolete or update a registered standard are not adopted
until reviewed. Security BCP updates can disable unsafe behavior immediately;
wire-format expansion follows the API compatibility policy.

## 2. Ownership

| Area | Primary owner | Required reviewers |
| --- | --- | --- |
| OAuth/OIDC/FAPI and JOSE | Protocol security | API, identity, SDK, Docker runtime |
| Authentication, passwords, OTP, WebAuthn | Identity security | UX, privacy, cryptography, recovery |
| SAML, SCIM, enterprise federation | Enterprise identity | Protocol security, XML security, privacy |
| HTTP, browser, cookies, CSRF, frontend | Browser security | Frontend, API, runtime, accessibility |
| Webhooks/events/API conventions | API security | Jobs, SDK, cryptography, customer integrations |
| Cryptography and key management | Cryptography/key custody | Protocol security, operations, Docker runtime |
| Privacy, assurance, and operational guidance | Privacy/security governance | Identity, operations, legal/qualified owner |

Owners monitor errata, status changes, vulnerabilities, interoperability results,
and deprecations. A missing owner blocks adoption.

## 3. OAuth 2.x

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| OAuth 2.0 Authorization Framework | [RFC 6749](https://www.rfc-editor.org/rfc/rfc6749) | Required base | Used only with RFC 9700 updates; authorization code, refresh, and client credentials |
| Bearer Token Usage | [RFC 6750](https://www.rfc-editor.org/rfc/rfc6750) | Required | TLS, header presentation; query bearer tokens prohibited |
| OAuth Security BCP | [RFC 9700](https://www.rfc-editor.org/rfc/rfc9700) | Required | Overrides unsafe RFC 6749 behavior; implicit and resource-owner-password grants rejected |
| PKCE | [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636) | Required | `S256` only; required for authorization code clients |
| Native Applications | [RFC 8252](https://www.rfc-editor.org/rfc/rfc8252) | Required when native enabled | External user agent, claimed HTTPS/app links or loopback; embedded user agents rejected |
| Authorization Server Metadata | [RFC 8414](https://www.rfc-editor.org/rfc/rfc8414) | Required | Exact issuer metadata and HTTPS |
| Issuer Identification | [RFC 9207](https://www.rfc-editor.org/rfc/rfc9207) | Required | Prevent authorization-server mix-up |
| Resource Indicators | [RFC 8707](https://www.rfc-editor.org/rfc/rfc8707) | Required | Exact allow-listed resource/audience binding |
| Pushed Authorization Requests | [RFC 9126](https://www.rfc-editor.org/rfc/rfc9126) | Profiled | Required for high-security/FAPI applications |
| Device Authorization | [RFC 8628](https://www.rfc-editor.org/rfc/rfc8628) | Planned | Polling, user-code privacy, verification URI and abuse limits |
| Token Revocation | [RFC 7009](https://www.rfc-editor.org/rfc/rfc7009) | Required | Non-enumerating token-type handling and shared revocation |
| Token Introspection | [RFC 7662](https://www.rfc-editor.org/rfc/rfc7662) | Required | Authenticated authorized resource servers, minimal response |
| JWT client assertion/grant | [RFC 7523](https://www.rfc-editor.org/rfc/rfc7523) | Required for private-key client auth | Exact issuer/subject/audience/time/JTI/key binding |
| Mutual TLS client auth/bound tokens | [RFC 8705](https://www.rfc-editor.org/rfc/rfc8705) | Planned/Profiled | High-security and workload profiles after proxy/runtime conformance |
| DPoP | [RFC 9449](https://www.rfc-editor.org/rfc/rfc9449) | Planned/Profiled | Proof nonce/replay/key/token binding; capability-specific |
| Token Exchange | [RFC 8693](https://www.rfc-editor.org/rfc/rfc8693) | Planned | Explicit delegation/impersonation profiles, actor chain/depth/audience limits |
| Rich Authorization Requests | [RFC 9396](https://www.rfc-editor.org/rfc/rfc9396) | Monitor | No generic acceptance until an application profile exists |
| Dynamic Client Registration | [RFC 7591](https://www.rfc-editor.org/rfc/rfc7591) | Planned | Policy-gated ecosystems only; not open anonymous registration |
| Dynamic Registration Management | [RFC 7592](https://www.rfc-editor.org/rfc/rfc7592) | Planned | Protected software statements/management credentials |
| JWT-Secured Authorization Request | [RFC 9101](https://www.rfc-editor.org/rfc/rfc9101) | Planned/Profiled | High-security signed request profile |
| Authorization Response JARM | [OpenID JARM 1.0 Final](https://openid.net/specs/oauth-v2-jarm-final.html) | Planned/Profiled | High-security signed response profile |
| OAuth 2.1 | [draft-ietf-oauth-v2-1-15](https://datatracker.ietf.org/doc/draft-ietf-oauth-v2-1/15/) | Monitor, March 2026 draft | Do not claim conformance; track consolidation against RFC 9700 profile |
| Browser-Based Applications | [current IETF OAuth browser-app draft](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/) | Reference/Monitor | Same-origin BFF/browser security decisions remain governed by ADR-0008 |

## 4. OpenID Connect and High-Security Profiles

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| OpenID Connect Core 1.0 | [Core incorporating errata set 2](https://openid.net/specs/openid-connect-core-1_0.html) | Required | Authorization code, ID token, UserInfo, nonce/auth_time/acr/amr/azp |
| OpenID Discovery 1.0 | [Discovery incorporating errata set 2](https://openid.net/specs/openid-connect-discovery-1_0.html) | Required | Exact issuer and metadata/JWKS consistency |
| Dynamic Client Registration 1.0 | [Registration incorporating errata set 2](https://openid.net/specs/openid-connect-registration-1_0.html) | Planned | Only policy-controlled registration |
| RP-Initiated Logout 1.0 | [Final](https://openid.net/specs/openid-connect-rpinitiated-1_0.html) | Required | ID-token/client binding and exact post-logout URI |
| Back-Channel Logout 1.0 | [Final](https://openid.net/specs/openid-connect-backchannel-1_0.html) | Planned | Replay-safe logout token and session binding |
| Front-Channel Logout 1.0 | [Final](https://openid.net/specs/openid-connect-frontchannel-1_0.html) | Planned | Browser limitations and iframe threat review |
| FAPI 2.0 Security Profile | [February 2025 Final](https://openid.net/specs/fapi-security-profile-2_0-final.html) | Profiled | Optional high-security application profile with sender-constrained tokens and PAR |
| FAPI 2.0 Attacker Model | [February 2025 Final](https://openid.net/specs/fapi-attacker-model-2_0-final.html) | Reference/Required for FAPI | Threat/conformance basis |
| OpenID conformance suite | [Certification/conformance](https://openid.net/certification/about-conformance-suite/) | Required evidence | OP and RP plans; FAPI plans when enabled |

OpenID certification is pursued for the hosted and reproducible self-hosted
release profiles before general availability. Certification supplements local
negative and tenancy tests.

## 5. JOSE, JWT, and Cryptographic Formats

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| JWS | [RFC 7515](https://www.rfc-editor.org/rfc/rfc7515) | Required | `jose`; compact/JSON form only where protocol specifies |
| JWE | [RFC 7516](https://www.rfc-editor.org/rfc/rfc7516) | Planned/Profiled | No generic encryption algorithm acceptance |
| JWK | [RFC 7517](https://www.rfc-editor.org/rfc/rfc7517) | Required | Public JWKS allow-list; private members never published |
| JWA | [RFC 7518](https://www.rfc-editor.org/rfc/rfc7518) | Required/profiled | ADR-0007 algorithm policy; `none` rejected |
| JWT | [RFC 7519](https://www.rfc-editor.org/rfc/rfc7519) | Required | Purpose/type/issuer/audience/time/ID validation |
| JWK Thumbprint | [RFC 7638](https://www.rfc-editor.org/rfc/rfc7638) | Required | `kid` construction per ADR-0007 |
| JWT BCP | [RFC 8725](https://www.rfc-editor.org/rfc/rfc8725) | Required | Algorithm/key/type/claim confusion defenses |
| JWT Access Token Profile | [RFC 9068](https://www.rfc-editor.org/rfc/rfc9068) | Profiled | Selected application JWT access-token profile |
| Selective Disclosure JWT | [RFC 9901](https://www.rfc-editor.org/rfc/rfc9901) | Monitor | Not enabled until product/privacy requirement and library review |
| Argon2 | [RFC 9106](https://www.rfc-editor.org/rfc/rfc9106) | Required | Argon2id policy in ADR-0006 |
| TLS 1.3 | [RFC 8446](https://www.rfc-editor.org/rfc/rfc8446) | Required | Public service baseline with TLS BCP |
| TLS BCP | [RFC 9325 / BCP 195](https://www.rfc-editor.org/rfc/rfc9325) | Required | Protocol/cipher/certificate operational baseline |

New algorithms are capability additions with vectors, custody support,
interoperability, downgrade review, and both-runtime evidence.

## 6. Password, OTP, Assurance, and WebAuthn

| Standard/guidance | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| HOTP | [RFC 4226](https://www.rfc-editor.org/rfc/rfc4226) | Reference | Underlying algorithm; no ordinary HOTP login product initially |
| TOTP | [RFC 6238](https://www.rfc-editor.org/rfc/rfc6238) | Planned/Required when enabled | SHA-1 interoperability baseline with protected seed, bounded window/replay; stronger algorithms capability-tested |
| WebAuthn Level 2 | [W3C Recommendation, 8 April 2021](https://www.w3.org/TR/webauthn-2/) | Required baseline | Registration/assertion verification, origin/RP/challenge/UV/UP/flags/sign count |
| WebAuthn Level 3 | [Candidate Recommendation Snapshot, 26 May 2026](https://www.w3.org/TR/2026/CR-webauthn-3-20260526/) | Monitor/Profiled subset | New fields/extensions only after browser/library vectors; no general Level 3 claim |
| CTAP 2.2 | [FIDO CTAP 2.2 Final](https://fidoalliance.org/specs/fido-v2.2-rd-20241003/) | Reference/Profiled | Authenticator capability/enterprise attestation only where needed |
| Digital Identity Guidelines | [NIST SP 800-63-4 Final, July 2025](https://pages.nist.gov/800-63-4/) | Reference | Risk/assurance framework; no government-conformance claim |
| Authentication and Authenticator Management | [NIST SP 800-63B-4 Final](https://pages.nist.gov/800-63-4/sp800-63b.html) | Reference/Required policy input | Password, authenticator, recovery, session, phishing/replay resistance |
| Federation and Assertions | [NIST SP 800-63C-4 Final](https://pages.nist.gov/800-63-4/sp800-63c.html) | Reference | Assurance/federation mapping |
| Password storage guidance | [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) | Living reference | Minimum monitored; exact platform policy remains ADR-0006 |

The product's `acr`/assurance labels map explicitly to evidence and do not claim
an NIST AAL unless all applicable technical and operational requirements pass.

## 7. SAML and SCIM

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| SAML 2.0 Core, Bindings, Profiles, Metadata, Security | [OASIS SAML 2.0 Standard set](https://docs.oasis-open.org/security/saml/v2.0/) | Planned | Web Browser SSO using HTTP-Redirect/POST; exact profile recorded by enterprise implementation |
| SAML 2.0 Approved Errata 05 | [OASIS Standard, 1 May 2012](https://docs.oasis-open.org/security/saml/v2.0/errata05/os/) | Required with SAML | Apply to complete SAML 2.0 profile |
| XML Signature 1.1 | [W3C Recommendation](https://www.w3.org/TR/xmldsig-core1/) | Required with SAML | Reviewed library, explicit signed element/reference; wrapping defenses |
| XML Encryption 1.1 | [W3C Recommendation](https://www.w3.org/TR/xmlenc-core1/) | Profiled | Encrypted assertions only with explicit algorithms/key policy |
| SCIM definitions/overview | [RFC 7642](https://www.rfc-editor.org/rfc/rfc7642) | Reference | Model/requirements context |
| SCIM Core Schema | [RFC 7643](https://www.rfc-editor.org/rfc/rfc7643) | Planned | Users/groups plus versioned extension schemas |
| SCIM Protocol | [RFC 7644](https://www.rfc-editor.org/rfc/rfc7644) | Planned | Bearer auth profile, ETags, PATCH/filter/bulk limits, idempotency |

SAML XML parsing forbids DTD/external entities and uses bounded documents,
schema/profile validation, exact destination/issuer/audience/time, replay state,
and signed-object identity. SCIM never maps an incoming group/attribute directly
to protected platform roles without configured policy.

## 8. HTTP APIs, Webhooks, and Events

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| HTTP Semantics | [RFC 9110](https://www.rfc-editor.org/rfc/rfc9110) | Required | Methods/status/conditional/cache semantics |
| HTTP/1.1 | [RFC 9112](https://www.rfc-editor.org/rfc/rfc9112) | Required runtime input | Framing/smuggling handled by trusted runtime/proxy and hostile tests |
| HTTP/2 | [RFC 9113](https://www.rfc-editor.org/rfc/rfc9113) | Required runtime input | Limits and proxy conformance |
| Structured Fields | [RFC 9651](https://www.rfc-editor.org/rfc/rfc9651) | Required where specified | Strict parsing/serialization |
| Problem Details | [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) | Required | ADR-0011 safe problem profile |
| Content-Digest | [RFC 9530](https://www.rfc-editor.org/rfc/rfc9530) | Required for signed webhooks | Exact received-content verification |
| HTTP Message Signatures | [RFC 9421](https://www.rfc-editor.org/rfc/rfc9421) | Planned/Required for webhook profile | Exact covered components, purpose tag, key, created/expiry, nonce/replay |
| UUID | [RFC 9562](https://www.rfc-editor.org/rfc/rfc9562) | Required | UUIDv7 per ADR-0009 |
| Deprecation | [RFC 9745](https://www.rfc-editor.org/rfc/rfc9745) | Required | ADR-0010 lifecycle |
| Sunset | [RFC 8594](https://www.rfc-editor.org/rfc/rfc8594) | Required | ADR-0010 retirement |
| RateLimit fields | [draft-ietf-httpapi-ratelimit-headers-11](https://datatracker.ietf.org/doc/draft-ietf-httpapi-ratelimit-headers/11/) | Profiled draft | ADR-0011 formatter isolated; review on change/RFC |
| Idempotency-Key | [draft-ietf-httpapi-idempotency-key-header-07](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/07/) | Profiled draft | ADR-0011 semantic fingerprint and shared store |
| OpenAPI | [OpenAPI 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) | Required | Released generated contracts and Swagger-compatible docs |
| JSON Schema | [2020-12](https://json-schema.org/draft/2020-12) | Required via OpenAPI | Generator/linter-supported subset |
| CloudEvents | [CNCF CloudEvents 1.0.2](https://github.com/cloudevents/spec/blob/v1.0.2/cloudevents/spec.md) | Reference/Planned | Event naming/envelope influence; no claim until event contract adopted |

Webhooks always use TLS, an application-specific RFC 9421 profile, content
digest, event/delivery IDs, bounded replay window, key rotation, idempotency, and
SSRF-safe destinations. A signature does not make payload content confidential.

## 9. Browser and Web Security

| Standard | Pinned reference | Status | Platform profile |
| --- | --- | --- | --- |
| Cookies | [RFC 6265](https://www.rfc-editor.org/rfc/rfc6265) | Required base | Host-only opaque sessions per ADR-0008 |
| Cookies bis | [draft-ietf-httpbis-rfc6265bis-21](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/21/) | Profiled/Monitor | `SameSite`, prefixes and current browser behavior; track RFC publication |
| Web Origin | [RFC 6454](https://www.rfc-editor.org/rfc/rfc6454) | Required | Exact origin validation; opaque/null origins rejected unless explicit |
| Fetch | [WHATWG Living Standard snapshot/current](https://fetch.spec.whatwg.org/) | Reference/Required browser behavior | CORS, redirects, credentials, origin/referrer integration |
| Fetch Metadata | [W3C Working Draft](https://www.w3.org/TR/fetch-metadata/) | Profiled/Monitor | Defense-in-depth request policy with `Vary`; never sole CSRF control |
| Content Security Policy Level 3 | [W3C Working Draft, 5 May 2026](https://www.w3.org/TR/2026/WD-CSP3-20260505/) | Profiled/Monitor | Deployed browser-supported nonce/hash/frame rules; WPT/browser matrix |
| Referrer Policy | [W3C Recommendation](https://www.w3.org/TR/referrer-policy/) | Required | Restrictive explicit policy |
| Permissions Policy | [W3C specification](https://www.w3.org/TR/permissions-policy/) | Required/profiled | Explicit minimum browser feature allow-list |
| HSTS | [RFC 6797](https://www.rfc-editor.org/rfc/rfc6797) | Required production | Controlled domains after HTTPS stability |
| MIME sniffing protection | [Fetch/HTML behavior and `nosniff`](https://fetch.spec.whatwg.org/#x-content-type-options-header) | Required | Correct types plus `X-Content-Type-Options: nosniff` |
| HTML | [WHATWG Living Standard](https://html.spec.whatwg.org/) | Reference | Safe forms/navigation/framing/popup/message behavior |

Living/draft browser specifications are validated against supported Chromium,
Firefox, and WebKit, Web Platform Tests where applicable, and the explicit
ADR-0008 security invariants. Browser implementation behavior never weakens
server-side CSRF, authorization, redirect, session, or tenant checks.

## 10. Rejected and Restricted Protocol Behavior

- OAuth implicit and resource-owner password credentials grants are rejected.
- PKCE `plain`, wildcard/open redirects, bearer tokens in URLs, caller-selected
  JOSE algorithms, JWT `none`, unsigned ID tokens, and cross-issuer key reuse are
  rejected.
- Passwords are not trimmed/truncated/normalized silently and are never stored
  reversibly.
- SAML artifact/legacy profiles, XML DTD/entities, SHA-1 signatures, and
  unconstrained signature/reference selection are rejected unless a future
  isolated migration profile proves necessity and safety; SHA-1 TOTP HMAC
  interoperability is a distinct scoped use, not signature approval.
- SCIM unauthenticated discovery/mutation, unlimited filter/bulk processing, and
  direct protected-role mapping are rejected.
- Cookie domain-wide authentication, JWT session cookies, third-party-cookie
  dependence, and framed login are rejected by ADR-0008.
- Draft features not explicitly profiled return unsupported capability rather
  than partial interpretation.

## 11. Change and Conformance Process

Automated monitoring watches RFC errata/status, IETF draft revisions/expiry,
OpenID/OASIS/W3C/FIDO publication changes, library advisories, and conformance
suite updates. Owners review at least quarterly and before:

- enabling a new protocol/extension/algorithm or changing a default;
- upgrading `jose`, `oauth4webapi`, WebAuthn/XML libraries, runtimes, or proxies;
- publishing an OpenAPI/SDK major or issuer metadata capability;
- browser support changes; and
- production certification or security assessment.

A register update records semantic differences, threat/privacy impact, migration,
rollout/rollback, interoperability, both-runtime results, and customer notice.
Expired drafts remain pinned for reproducibility but cannot be newly enabled
without renewal. Conformance fixtures and results are versioned release
evidence, not generated secrets or real personal data.
