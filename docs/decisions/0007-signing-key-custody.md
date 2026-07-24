# ADR-0007: Signing-Key Custody and Rotation

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security and platform engineering
- **Related tasks:** DEC-008, PLT-008, PLT-013, IAM-015, IAM-016
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform signs ID tokens, JWT access tokens, authorization responses, logout
tokens, assertions, and other security artifacts. Compromise or accidental loss
of a signing key can affect every application trusting its issuer. Key custody
must support a European hosted service and horizontally scaled self-hosted
Docker deployments without making hosted and self-hosted editions different products.

Private-key storage, remote signing, metadata, JWKS publication, and lifecycle
coordination have different responsibilities. Combining them in a provider SDK
would create lock-in and make deterministic conformance testing difficult.

## Decision

Separate the key system into two platform contracts:

1. `SigningKeyCustody` creates or imports a key, returns a non-secret handle and
   public JWK, signs an exact byte sequence, reports capabilities and health, and
   destroys key material. It never returns an exportable private key through the
   application contract.
2. `SigningKeyRepository` stores non-secret key metadata, state transitions,
   issuer and purpose bindings, public JWKs, custody handles, timestamps, and
   optimistic-concurrency versions in shared transactional storage.

Runtime-neutral lifecycle services own selection, publication, rotation, and
retirement. JOSE serialization and validation use `jose` per ADR-0005. Hosted
and self-hosted Docker deployments call the same contracts and lifecycle code; only custody adapter
configuration differs.

### Key Rings and Isolation

- Each issuer and environment has an independent key ring.
- The management-plane issuer and customer identity issuers never share keys.
- Hosted top-level organizations receive isolated issuer rings; end-user
  organizations inside a user pool do not create separate issuer keys.
- Signing, encryption, webhook, cookie, credential, and data-encryption keys use
  separate purposes and cannot be substituted.
- A key belongs to exactly one environment, issuer, purpose, algorithm, and
  custody backend.
- Key material is never copied between hosted and self-hosted deployments.

### Algorithms

- RS256 is the initial default for broad OpenID Connect interoperability, with a
  minimum 2048-bit RSA modulus.
- ES256 is an application-selectable alternative after the client declares
  support and both-runtime conformance passes.
- `none`, symmetric ID-token signing, caller-selected algorithms, RSA keys below
  policy, and mixed key/algorithm use are rejected.
- EdDSA, RSA-PSS, JWE algorithms, and post-quantum algorithms are explicit future
  capabilities, not silently enabled defaults.
- Algorithm allow-lists bind the protected header, key metadata, issuer policy,
  token type, and verifier expectation as required by JWT security guidance.

Every supported algorithm has deterministic and published test vectors plus
sign/verify interoperability tests through software and remote-signing adapters.

### Key Identifiers

`kid` is the base64url-encoded SHA-256 JWK thumbprint defined by RFC 7638,
computed from the public JWK by `jose`. Key material is never reused across
rings, so the identifier does not correlate otherwise separate issuers.

Repository row identifiers remain distinct UUIDv7 values. Consumers treat
`kid` as opaque. A published JWK includes only required public members plus
approved `kid`, `use: "sig"`, and `alg`; private parameters, custody handles,
tenant identifiers, internal state, and operational timestamps are omitted.

### Lifecycle

Keys use a compare-and-swap state machine:

```text
creating -> staged -> active -> retiring -> retired -> destroyed
                     \-> compromised
staged/retiring ------> compromised
```

- `creating`: custody operation is in progress or awaiting reconciliation.
- `staged`: public JWK is published but the key cannot sign.
- `active`: the only key selected to sign for its ring, purpose, and algorithm.
- `retiring`: cannot sign new artifacts but remains published for verification.
- `retired`: no longer published; private material remains only for a bounded
  incident and rollback window.
- `destroyed`: custody confirms private material destruction; public metadata
  and audit evidence remain.
- `compromised`: permanently barred from signing and normal verification.

State changes are idempotent, audited security events. A distributed lease plus
repository version prevents multiple instances from rotating the same ring.
Correctness never depends on an in-process scheduler, lock, or cache.

### Scheduled Rotation

- Rotate active issuer keys at least every 90 days by default. A deployment may
  shorten but not exceed the platform maximum.
- Create and publish a staged key before activation. The default staging period
  is 15 minutes and must be at least the configured JWKS cache lifetime plus
  clock skew and deployment propagation allowance.
- Atomically activate the staged key and move the previous active key to
  `retiring`.
- Publish a retiring key until:

```text
last signature time
+ longest artifact verification lifetime
+ accepted clock skew
+ maximum JWKS cache lifetime
+ rollout safety margin
```

- Only then mark it retired. Destroy it after the configured incident-response
  retention window and verified backup/restore policy.
- A rotation job can resume safely after any step and reconciles repository state
  with the custody provider before taking further action.

The default JWKS response uses `Cache-Control: public, max-age=300,
stale-while-revalidate=60`, a strong ETag derived from the canonical public set,
and conditional requests. Discovery points to one HTTPS `jwks_uri` per issuer.

### Emergency Rotation

An authorized two-person operation can declare a key suspected or compromised.
The workflow:

1. atomically prevents further signing with the key;
2. activates a healthy staged key or creates an emergency replacement;
3. removes the compromised key from newly generated JWKS responses;
4. increments the affected issuer/token revocation epoch where supported;
5. revokes affected sessions, grants, assertions, or credentials according to
   blast radius;
6. purges controlled caches and publishes a high-priority security event;
7. preserves public metadata and custody audit evidence for investigation; and
8. requires explicit security approval before private-material destruction.

Third-party JWKS caches may continue accepting a compromised key until their
cache or token expires. Short artifact lifetimes, introspection for high-risk
APIs, receiver refresh-on-unknown-`kid`, and incident communication reduce but
cannot eliminate this residual risk.

### Custody Profiles

#### Hosted Europe

Use an EU-located managed KMS/HSM adapter with non-exportable asymmetric keys,
provider audit logs, least-privilege signing identities, dual control for
destruction, and an approved European disaster-recovery topology. A provider
name is configuration, not a domain dependency.

The hosted application receives permission to sign with a scoped handle; it
cannot administer or export keys. Administrative credentials are held by a
separate rotation identity.

#### Self-Hosted Production

Support two equal conformance profiles:

- an external KMS/HSM remote-signing adapter; and
- an encrypted software-key adapter for installations without an HSM.

The software adapter generates a unique data-encryption key per private key,
encrypts PKCS#8 material with AES-256-GCM, and wraps the data key with a
deployment master key supplied through the secrets adapter. Associated data
binds environment, issuer, ring, purpose, algorithm, `kid`, and record version.
Encrypted material lives in shared transactional storage so every Docker
instance can sign consistently. The master key is never stored in that database.

Master-key rotation rewraps data keys without changing issuer signing keys.
Backups containing encrypted material remain in Europe and are useless without
separately protected master-key recovery material.

#### Local Development and Tests

Local development uses the same encrypted software adapter with a key supplied
by a local ignored secrets file or Docker secret and state persisted in the
development database. It must survive process restarts and multiple local
instances.

Tests use deterministic injected key fixtures. Ephemeral process-generated keys
are allowed only in isolated tests explicitly asserting ephemeral behavior;
they are forbidden in deployable configuration.

### Failure Behavior

- Signing fails closed when custody is unavailable, a handle is unknown, state is
  not active, or the adapter cannot prove the requested algorithm.
- The service never falls back to a retired key, a local key, or another custody
  provider.
- Readiness reports inability to sign without exposing handles or key metadata.
- Verification can continue with already published public keys during a custody
  outage.
- Bounded retries use idempotency keys and only retry errors the adapter marks
  safe; an ambiguous remote signature is not blindly repeated.
- No private key or decrypted key is cached across requests in process.

## Alternatives Considered

### Provider SDK in Issuer Code

Rejected because it locks runtime-neutral protocol code to hosted infrastructure
and leaves self-hosters with different behavior.

### Exportable Private Keys in Environment Variables

Rejected for production. Rotation, audit, multi-key overlap, size limits, and
blast radius are poor, and every process receives full key material.

### One Global Signing Key

Rejected because compromise crosses management and customer trust boundaries
and prevents isolated rotation or deletion.

### Per-Application Signing Keys

Not the default because applications under one issuer consume the issuer JWKS
and expect consistent issuer semantics. A dedicated issuer can provide stronger
application isolation when required.

### Immediate Old-Key Removal on Routine Rotation

Rejected because valid tokens and cached JWKS documents would fail before their
declared lifetime.

## Security Impact

Private material is inaccessible to ordinary repositories, logs, traces, support
tools, and API responses. Signing authorization binds the exact issuer, purpose,
algorithm, key state, and payload. Custody administration and application
signing have separate identities and audit trails.

Software custody has a larger compromise surface than non-exportable HSM keys
and must be disclosed in deployment health. It remains necessary for portable,
fully self-hosted operation.

## Privacy and Residency Impact

Keys, encrypted backups, custody logs, and signing operations for hosted service
remain in approved European regions. JWKs are public and contain no organization
names or personal data. Custody audit events are security records with bounded
European retention.

## Portability and Self-Hosting Impact

All Docker/Node deployments share key metadata, lifecycle, JOSE, and conformance
tests indefinitely. The portable software-custody profile requires only shared
storage and a protected deployment master key. Hosted HSM acceleration never
becomes a prerequisite for self-hosted correctness.

## Operational Impact

Rotation metrics cover key age, staged propagation, signatures by `kid`,
retiring-key use, custody latency/errors, reconciliation lag, and destruction
deadlines. Alerts fire before expiry and whenever more than one active key
exists for a ring/algorithm.

Disaster-recovery exercises prove that public JWKS, encrypted software keys,
master-key recovery, metadata, and audit order can be restored without silently
creating a new issuer identity. Non-exportable hosted keys require an approved
EU multi-region recovery or an explicit forced-rotation/token-revocation plan.

## Consequences

- Key lifecycle remains provider-neutral and horizontally safe.
- Hosted deployments can use non-exportable custody while self-hosters retain a
  complete portable path.
- Routine rotation requires staged publication and potentially long overlaps.
- Software custody adds envelope-encryption and master-key recovery operations.
- Emergency rotation cannot invalidate keys already held in uncontrolled caches.

## Validation

- Run sign/verify and negative algorithm vectors for every adapter in
  Node/Docker where applicable.
- Prove identical public JWKs and RFC 7638 `kid` values across custody adapters.
- Model every allowed and denied lifecycle transition.
- Exercise concurrent, interrupted, retried, routine, and emergency rotation.
- Prove JWKS ETag/cache behavior and overlap using controlled time.
- Prove ciphertext/AAD tampering, wrong master keys, destroyed handles, custody
  outages, and ambiguous remote errors fail safely.
- Run backup/restore and master-key rewrap drills with synthetic keys.
- Perform hosted live-adapter validation only with approved European credentials;
  deterministic conformance adapters remain mandatory.

## Review Triggers

- OIDC interoperability guidance changes the default algorithm.
- A selected algorithm or key size is weakened or deprecated.
- Token lifetimes or JWKS caching exceed the recorded overlap formula.
- A custody provider changes residency, exportability, or signing semantics.
- A self-hosted profile cannot rotate safely across multiple Docker instances.
- New signing purposes are introduced.

## References

- [JSON Web Key, RFC 7517](https://www.rfc-editor.org/rfc/rfc7517)
- [JWK Thumbprint, RFC 7638](https://www.rfc-editor.org/rfc/rfc7638)
- [JWT Best Current Practices, RFC 8725](https://www.rfc-editor.org/rfc/rfc8725)
- [OpenID Connect Discovery 1.0](https://openid.net/specs/openid-connect-discovery-1_0.html)
- [`jose` key and JWKS support](https://github.com/panva/jose)
