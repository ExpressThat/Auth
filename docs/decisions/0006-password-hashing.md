# ADR-0006: Password Hashing

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security and platform engineering
- **Related tasks:** DEC-007, IAM-007, IAM-008, SEC-005
- **Supersedes:** None
- **Superseded by:** None

## Context

Password hashing must remain memory-hard, versioned, and portable between
Cloudflare Workers and Node/Docker. Users and databases can move between those
deployment models, and rolling deployments can contain both runtime artifacts.
Hashes created by one implementation must therefore be verifiable by every
supported implementation.

Workers prohibit runtime WebAssembly compilation. A library that embeds a Wasm
binary and calls `WebAssembly.compile` failed inside the retained Workerd test,
even though it describes itself as browser and Web Worker compatible. Workers
can load statically imported Wasm modules, but that library does not expose its
Argon2 implementation that way.

## Decision

Use a `PasswordHasher` platform contract with:

- `@noble/hashes` 2.2 as the portable TypeScript Argon2id implementation for the
  mandatory Workers and Docker baseline; and
- `@node-rs/argon2` 2.0 as an optional accelerated Node/Docker adapter.

The portable adapter is required even in Docker releases so self-hosters are not
dependent on a native binary. The native adapter is selected by deployment
capability, never imported by runtime-neutral or Workers bundles. Both consume
and produce standard Argon2 PHC strings and must pass the same conformance suite.

The executable evaluation in `tooling/password-hashing-spike` proves the RFC
test vector, cross-adapter verification, malformed input rejection, approved
parameters, latency ceilings, complete portable-code coverage, and real Workerd
execution. Its tests move into the production adapter packages when those are
created, after which the spike is removed.

### Initial Hash Policy

| Parameter | Value |
| --- | --- |
| Algorithm | Argon2id |
| Argon2 version | 19 (`0x13`) |
| Memory | 19,456 KiB (19 MiB) |
| Iterations | 2 |
| Parallelism | 1 |
| Salt | 16 random bytes |
| Output | 32 bytes |
| Encoding | Standard PHC string |
| Maximum password input | 1,024 UTF-8 bytes |

This is the OWASP minimum Argon2id profile and a compatibility floor, not a
permanent upper bound. Increase work in a new named policy after representative
Workers and Docker benchmarks. Organizations and applications may require a
stronger policy but cannot weaken the platform minimum.

Passwords are hashed as the exact UTF-8 bytes supplied after transport decoding.
Do not trim, truncate, case-fold, or silently normalize them. Password-policy
checks are separate from hashing, and the maximum is measured in bytes.

### Stored Format and Versioning

The credential record stores:

- the full PHC string, including algorithm, version, work factors, salt, and hash;
- a platform hash-policy identifier;
- the hashing adapter identifier for diagnostics only;
- an optional pepper key identifier, never the pepper; and
- creation, successful verification, and rehash timestamps.

Verification dispatches by a strict allow-list of known algorithm and policy
versions. It parses and bounds every PHC parameter before allocating memory or
performing work so a modified database value cannot cause unbounded CPU or
memory use. Unknown, malformed, oversized, or disabled formats fail safely.

### Rehash Rules

After a successful verification, rehash with the current policy when:

- the algorithm or Argon2 version is no longer current;
- any cost, salt, or output parameter is below current policy;
- the active pepper key changed;
- an imported legacy credential is accepted by a migration-only verifier; or
- the stored policy identifier is missing or retired.

Rehash uses a compare-and-swap update so concurrent logins cannot overwrite a
newer credential. Failure to rehash does not turn a correctly verified login
into an ambiguous password error, but it emits a retryable security operation
and bounded operational alert.

Never generate new bcrypt, scrypt, or PBKDF2 credentials in the standard
profile. A separately reviewed migration or compliance adapter may verify a
tagged legacy hash and immediately upgrade it after login.

### Peppering

Peppering is optional defense in depth and must use the secrets/cryptography
adapter. When enabled:

- use a versioned secret input supported identically by every active adapter;
- keep pepper material outside the user database;
- store only a non-secret key identifier with the credential;
- support an overlap window for rotation; and
- require a password reset if the only usable pepper is irrecoverably lost.

Pepper behavior requires its own cross-adapter vectors before enablement. It is
not part of the initial unpeppered PHC conformance spike.

## Alternatives Considered

### Embedded Wasm Compiled at Runtime

Rejected after an executable Workerd test. Workers disallow
`WebAssembly.compile` and buffer-based instantiation. A future statically
imported Argon2 Wasm adapter may be added only with reproducible builds, source
review, runtime tests, and cross-verification evidence.

### Native Argon2 Only

Rejected because it excludes Workers, complicates minimal Docker images, and
makes hashes operationally dependent on native package availability.

### Portable JavaScript Only

Rejected as the only adapter. The selected portable Argon2 implementation is
materially slower than native code and its Argon2 code was not in the library's
older independent audit scope. It provides the required compatibility baseline,
but Docker should use the native adapter after conformance and platform checks.

### Web Crypto PBKDF2

PBKDF2 is widely portable and may be required for a future FIPS profile, but it
is not memory-hard and is not the standard password-storage choice. A compliance
adapter must use a tagged format and cannot silently replace the Argon2 profile.

### Runtime-Specific Hash Formats

Rejected. Deployment migration and mixed rolling releases must never invalidate
credentials or require plaintext password access.

## Security Impact

Unique salts come only from the cryptographic random adapter. Comparison covers
the complete fixed-length output without early exit. PHC parsing is strict and
bounded before expensive operations. Passwords, salts before persistence,
derived bytes, peppers, and PHC strings are never logged or placed in traces.

The portable implementation needs a focused cryptographic review before
production because its Argon2 code was outside the older independent audit.
The RFC vector and native cross-verification reduce interoperability risk but do
not replace source review or an external assessment.

Authentication endpoints combine hashing with distributed rate limits,
credential-stuffing defenses, breached-password policy, and generic responses.
Memory pressure is bounded through admission control; in-process semaphores are
not treated as distributed protection.

## Privacy and Residency Impact

Only one-way password hashes are stored; plaintext passwords are never queued or
persisted. Hashing occurs inside the selected European deployment. External
breached-password checks must use privacy-preserving range queries and an
approved outbound-data policy.

## Portability and Self-Hosting Impact

Workers and Node/Docker remain equal permanent targets. Every accepted hash is
verified by both adapters in CI. Docker images include a portable fallback and
report native-acceleration readiness without leaking credential data. No hosted
hashing service is required.

## Operational Impact

The initial regression ceilings are below one second for native Node hashing and
below two seconds for one portable Workerd hash in the controlled CI fixture.
Production release tests record p50 and p95 hashing and verification latency,
memory, CPU, concurrency, and cold-start behavior on representative Workers
plans and Docker architectures.

These ceilings catch regressions; they are not user-facing SLOs. Policy
calibration aims for the strongest parameters compatible with the authentication
latency and abuse-capacity budgets. Autoscaling does not remove the need for
distributed admission control because each concurrent attempt consumes memory.

## Consequences

- Standard PHC strings allow adapter and deployment migration.
- Docker gains native performance without becoming a different product.
- The portable path adds CPU latency and requires further security review.
- Parameter upgrades require successful-login rehash and long migration windows.
- Strict parsing intentionally rejects arbitrary attacker-controlled PHC costs.

## Validation

The production adapter packages must retain:

1. the Argon2id RFC 9106 vector;
2. portable-to-native and native-to-portable PHC verification;
3. correct-password, wrong-password, Unicode, maximum-length, and invalid-length
   cases;
4. malformed, unsupported, oversized, and downgraded PHC parameter cases;
5. complete first-party coverage;
6. Workers-runtime and built-Docker execution;
7. latency and memory regression measurements; and
8. rehash, pepper rotation, concurrency, and legacy-import tests when added.

## Review Triggers

- OWASP raises its minimum Argon2id profile.
- A portable, independently audited static-Wasm implementation is available.
- Either selected library is unmaintained or receives a security advisory.
- Workers or Node changes relevant cryptographic or memory behavior.
- Production measurements exceed latency, memory, or abuse-capacity budgets.
- A FIPS deployment profile is required.

## References

- [Argon2, RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [`@noble/hashes` documentation and audit notes](https://github.com/paulmillr/noble-hashes)
- [`@node-rs/argon2` repository](https://github.com/napi-rs/node-rs)
- [Workers WebAssembly restrictions](https://developers.cloudflare.com/workers/runtime-apis/web-standards/)
- [Workers static WebAssembly modules](https://developers.cloudflare.com/workers/runtime-apis/webassembly/javascript/)
