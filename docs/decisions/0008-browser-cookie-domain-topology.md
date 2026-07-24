# ADR-0008: Browser Cookie and Domain Topology

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, identity, and frontend engineering
- **Related tasks:** DEC-009, IAM-001 through IAM-014, FEU-001 through FEU-028
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform has two separate browser trust planes:

- management administrators operate top-level organizations and applications;
- end users authenticate to a shared user pool, grant per-application consent,
  manage their account, and switch end-user organization context.

Hosted deployments offer platform domains and verified customer domains.
Self-hosted deployments choose their own domains. Shared user-pool SSO requires a
stable first-party origin, while application-specific domains, iframe embedding,
and browser privacy controls can fragment cookie state. Domain and cookie choices
must not weaken tenant resolution or make Docker replicas behave differently.

## Decision

Use one stable, HTTPS identity origin per issuer and environment. Serve its
browser UI and cookie-authenticated browser API on the same origin:

```text
https://<management-origin>/
  /sign-in, /organizations, /applications, /account
  /api/v1/management-browser/*

https://<customer-identity-origin>/
  /authorize, /login, /sign-up, /consent, /account, /logout
  /api/v1/identity-browser/*
  /.well-known/*, /oauth/*, /oidc/*, /jwks.json
```

Static frontend assets can be served by a separate implementation internally,
but the external reverse proxy routes UI and browser API through the
same origin. Public bearer-token APIs may use separate API origins and never
accept browser session cookies.

Management and customer identity origins are always different sites. Their
cookies, sessions, CSRF tokens, issuers, keys, and callback allow-lists are not
shared. The non-deletable management organization does not create a cookie
exception to this boundary.

### Hosted Domains

- The management plane uses one platform-owned European management origin.
- Each top-level organization/environment receives an opaque platform identity
  hostname; mutable organization names and slugs are not security identifiers.
- One verified custom hostname can become the primary identity origin for an
  issuer/environment.
- All applications sharing that issuer use its primary identity origin to gain
  shared user-pool SSO. Branding, consent, policy, and return destinations remain
  application-specific.
- An application-specific vanity hostname is an HTTPS redirect alias to the
  primary origin before protocol or credential processing. It does not receive
  session cookies and is not an alternate issuer.
- Organizations needing cookie isolation between applications create separate
  issuers/environments. They may still use configured identity linking or
  migration, but do not receive ambient cross-issuer SSO.

This makes the trade-off explicit: unrelated application domains cannot share a
host-only cookie. The platform does not set a parent-domain cookie or depend on
third-party cookies to simulate that sharing.

### Custom-Domain Verification

A domain becomes active only after:

1. normalized hostname syntax, public-suffix, reserved-name, and collision checks;
2. DNS ownership proof using a unique expiring challenge;
3. expected CNAME/target validation;
4. automated TLS issuance and certificate validation;
5. an HTTP challenge proving requests reach the intended deployment;
6. issuer metadata, redirect, and security-header probes; and
7. an atomic state transition audited to the requesting administrator.

DNS, certificate, and deployment automation use adapters. Resolution is repeated
to detect takeover, dangling CNAME, and ownership loss. Host headers are matched
to an active verified-domain record before tenant context is loaded; forwarded
host/protocol headers are trusted only from an allow-listed proxy boundary.

Changing the primary hostname changes the OpenID issuer and is a versioned issuer
migration, not a cosmetic setting. The old issuer remains read-only for its
declared token/JWKS overlap or redirects only browser entry pages. Protocol
metadata never claims two issuer strings are interchangeable.

### Cookies

All production cookies are `Secure`; session and transaction cookies are
`HttpOnly`. Authentication cookies use the `__Host-Http-` prefix where supported
and the equivalent enforced attributes everywhere:

```text
Secure; HttpOnly; Path=/; no Domain
```

The platform sets no authentication cookie with a `Domain` attribute. Names are
plane- and purpose-specific so management, identity, interaction, and recovery
state cannot be confused.

| Cookie | SameSite | Contents |
| --- | --- | --- |
| Management session | Lax | Opaque random session reference |
| End-user identity session | Lax | Opaque random session reference |
| Login/consent interaction | Lax | Opaque, one-time transaction reference |
| CSRF presentation | Strict | Opaque reference to server-side CSRF state |

Cookie values contain no JWT, profile, organization membership, consent, secret,
or authorization result. Store only a keyed hash of the random session token in
shared storage. The server record owns expiry, active organization context,
authentication methods/time, risk state, and revocation.

Rotate the session reference after login, privilege change, account or
organization switch, recovery, impersonation start/end, and suspicious activity.
Absolute and idle expiry are server-enforced. Logging out revokes server state
before expiring the cookie.

`SameSite=Lax` permits top-level safe-method returns to the identity origin while
withholding the main session from ordinary cross-site subresource and POST
requests. SameSite is defense in depth, not the sole CSRF control.

### Cross-Site Identity-Provider Callbacks

Enterprise SAML POST bindings and OIDC `form_post` callbacks cannot rely on the
Lax identity-session cookie. Their callback carries a high-entropy, single-use,
short-lived correlation value referencing server-side state. The callback:

1. validates issuer/provider, destination, signature, state/RelayState, expiry,
   and one-time use without ambient session authority;
2. stores the validated result against the interaction;
3. redirects with a `303` to a same-origin continuation URL; and
4. resumes the identity session only after binding the interaction to the
   browser and expected login attempt.

No general `SameSite=None` authentication session is introduced. A narrowly
scoped callback cookie may be considered only if a protocol cannot carry safe
correlation state and must have its own threat review and conformance tests.

### CSRF and Request-Origin Policy

Every cookie-authenticated state change requires all applicable controls:

- a synchronizer token tied to session, origin, purpose, and expiry, sent in a
  custom request header;
- exact `Origin` validation, with a tightly defined legacy fallback;
- Fetch Metadata checks that reject unexpected cross-site and non-navigation
  requests;
- a non-simple content type for browser API mutations;
- idempotency and reauthentication for high-risk operations; and
- POST or another non-safe method—GET and HEAD never mutate state.

Responses that vary by Fetch Metadata set the appropriate `Vary` headers.
Cross-origin credentialed CORS is disabled for browser session APIs. Public APIs
use bearer/DPoP credentials and exact registered origins where browser access is
required.

OAuth/OIDC requests additionally enforce registered redirect URIs, `state`,
`nonce`, PKCE, issuer, client, and interaction binding. These protocol controls
do not replace CSRF protection on login, consent, account, or management forms.

### Redirect Boundaries

- Redirect and post-logout URIs are matched exactly against normalized registered
  values, including scheme, host, port, path, and query.
- Fragments and user-info components are rejected.
- HTTPS is required except loopback HTTP redirects for native development clients
  under the applicable native-app rules.
- Wildcard hosts, open path prefixes, unverified custom schemes, and redirect
  chaining through application-controlled parameters are rejected.
- Internationalized hostnames are stored in canonical ASCII form and displayed
  safely to resist look-alike attacks.
- A post-logout redirect requires an ID-token/client binding or user confirmation
  and an exact registered URI.
- Error redirects include only protocol-safe values and never internal messages,
  credentials, or unvalidated input.

### Embedded and Popup Flows

The standard login, sign-up, consent, recovery, account, and management
experiences require a top-level secure browsing context. The platform does not
promise iframe silent SSO because third-party cookies may be blocked or
partitioned and clickjacking protection conflicts with arbitrary embedding.

- `prompt=none` is supported only when the request reaches the primary identity
  origin with valid first-party state; absence of that state returns the
  standards-defined interaction-required result.
- CHIPS/partitioned cookies are not used as a substitute for shared SSO because
  each top-level site receives different state.
- Popup flows are optional progressive enhancement. They use Authorization Code
  with PKCE, exact opener origin checks, a one-time channel, and `postMessage`
  with an exact target origin. Closing or blocking the popup falls back to a
  redirect.
- Framing is denied by CSP `frame-ancestors` by default. A future embedded
  component needs explicit per-application origins, sandboxing, storage-access
  behavior, and a dedicated threat model.

### Local Development and Self-Hosting

Production and staging require HTTPS. Local development prefers a generated
local CA/reverse proxy so cookie behavior matches production. A clearly marked
localhost-only profile may relax transport attributes where a browser requires
it, but cannot be used with non-loopback hosts or deployable configuration.

Self-hosters configure separate management and identity origins, trusted proxy
ranges, public base URLs, and certificate adapters. Startup fails when origins
collide, use insecure production schemes, resolve ambiguously, or disagree with
issuer metadata. The same topology and browser conformance suite runs against
the Docker image and multi-replica deployment.

## Alternatives Considered

### Parent-Domain Session Cookies

Rejected. A vulnerable sibling subdomain increases session blast radius, custom
domains cannot participate, and management/customer isolation becomes fragile.

### Cross-Origin SPA API with Credentialed CORS

Rejected as the default because it enlarges CORS, CSRF, preflight, and cookie
configuration surface. Browser APIs are exposed through the UI origin.

### One Custom Domain per Application with Ambient SSO

Impossible without redirecting through a common first-party identity origin or
depending on third-party state. The platform chooses the common primary issuer
origin and treats app vanity domains as redirect aliases.

### SameSite=None for the Main Session

Rejected. It weakens the default cross-site boundary and still does not guarantee
availability when browsers block third-party cookies.

### JWT Session Cookies

Rejected. Immediate revocation, organization switching, impersonation, risk
updates, and concurrent-session management require authoritative shared state.

## Security Impact

Host-only opaque sessions reduce subdomain and data-exposure risk. Same-origin
browser APIs, strict origin checks, CSRF tokens, Fetch Metadata, and safe methods
form layered CSRF protection. Verified host mapping happens before tenant
resolution, preventing attacker-controlled Host headers from choosing a tenant.

Security headers include a restrictive CSP, `frame-ancestors`, HSTS on controlled
production domains, `X-Content-Type-Options`, `Referrer-Policy`, and an explicit
Permissions Policy. HSTS rollout for customer domains waits until ownership and
HTTPS stability are proven.

## Privacy and Residency Impact

Opaque cookies expose no personal or organization data to the browser. Session
records and domain-control evidence remain in the configured European region.
The platform does not use cross-site identity cookies for advertising or
tracking and does not broaden cookies to parent domains.

## Portability and Self-Hosting Impact

The rules use standard HTTP/browser behavior and a domain/certificate adapter,
not a hosted-only feature. Docker reverse proxies and application routing must
produce the same external origin, cookie attributes, headers, redirects, and
failure behavior.

## Operational Impact

Domain state, certificate expiry, DNS drift, Host mismatches, cookie rejection,
CSRF denials, callback correlation failures, and issuer migration are observable
without logging cookie values or personal data. Synthetic browser tests cover
hosted, custom, and self-hosted domains.

## Consequences

- Shared SSO works across applications that use one primary issuer origin.
- Application vanity domains cannot independently hold the shared session.
- Browser and API routing must present a same-origin facade.
- Cross-site POST callbacks require explicit server-side interaction correlation.
- Issuer-domain migration is operationally significant and cannot be instant.

## Validation

- Assert every cookie attribute and deletion path in real Chromium, Firefox, and
  WebKit.
- Run CSRF, Origin, Fetch Metadata, CORS, clickjacking, fixation, logout, and
  session-rotation negative tests.
- Exercise top-level OAuth redirects, enterprise POST callbacks, popup fallback,
  and blocked/partitioned third-party-cookie modes.
- Verify exact redirect and post-logout matching with malicious URL corpora.
- Run domain verification, takeover, DNS drift, certificate failure, Host-header,
  trusted-proxy, and issuer-migration tests.
- Execute the same browser journeys against the built Docker image and multiple replicas.

## Review Triggers

- Browser SameSite, cookie-prefix, CHIPS, FedCM, or Storage Access behavior changes.
- A supported enterprise protocol cannot use the callback correlation design.
- The product adds a framed login or embeddable account component.
- An issuer needs multiple simultaneously authoritative hostnames.
- A reverse proxy cannot preserve the verified external origin.

## References

- [Cookies: HTTP State Management Mechanism](https://datatracker.ietf.org/doc/draft-ietf-httpbis-rfc6265bis/)
- [Set-Cookie reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)
- [Fetch Metadata Request Headers](https://www.w3.org/TR/fetch-metadata/)
- [OAuth 2.0 for Browser-Based Applications](https://datatracker.ietf.org/doc/draft-ietf-oauth-browser-based-apps/)
- [OpenID Connect RP-Initiated Logout 1.0](https://openid.net/specs/openid-connect-rpinitiated-1_0.html)
