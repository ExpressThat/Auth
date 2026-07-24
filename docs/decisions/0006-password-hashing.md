# ADR-0006: Password Hashing

- **Status:** Accepted
- **Date:** 2026-07-23
- **Last updated:** 2026-07-24
- **Owners:** Security and platform engineering
- **Related tasks:** DEC-007, IAM-007, IAM-008, SEC-005
- **Supersedes:** None
- **Superseded by:** None

## Context

Password hashing must remain memory-hard, versioned, portable across supported
CPU architectures, and safe during rolling Docker deployments. Users, data, and
backups must move between hosted and self-hosted installations without making
stored credentials unverifiable.

## Decision

Use a `PasswordHasher` contract with:

- `@node-rs/argon2` as the preferred Node.js adapter; and
- `@noble/hashes` as the portable TypeScript compatibility adapter.

Both consume and produce standard Argon2 PHC strings and pass the same
conformance suite. Selection is an explicit deployment capability. Domain code
never imports either implementation directly. The portable adapter prevents a
native package or CPU architecture from becoming a data-portability dependency.

The production provider package in `packages/providers/password-argon2` proves
the RFC vector, cross-adapter verification, malformed-input rejection, approved
parameters, latency ceilings, and complete first-party coverage.

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

This is the OWASP minimum Argon2id profile and a compatibility floor. Increase
work through a new named policy after representative Docker architecture and
concurrency benchmarks. Organizations and applications may require a stronger
policy but cannot weaken the platform minimum.

Passwords are the exact UTF-8 bytes supplied after transport decoding. Do not
trim, truncate, case-fold, or silently normalize. The maximum is measured in
bytes, and password-policy checks remain separate from hashing.

### Stored Format and Versioning

The credential stores the full PHC string, platform policy identifier, adapter
identifier for diagnostics only, optional pepper-key identifier, and creation,
verification, and rehash timestamps.

Verification strictly allow-lists algorithms and policies. It parses and bounds
all PHC parameters before allocation or expensive work. Unknown, malformed,
oversized, or disabled formats fail safely.

After successful verification, compare-and-swap rehashing uses the current
policy when an algorithm, version, cost, salt, output, pepper, imported format,
or policy identifier is stale. A rehash failure records a retryable security
operation without turning a valid password into an ambiguous error.

New standard credentials never use bcrypt, scrypt, or PBKDF2. A separately
reviewed migration or compliance adapter may verify tagged legacy credentials
and immediately upgrade them.

### Peppering

Peppering is optional defense in depth through the secret/cryptography adapter.
Pepper material stays outside the user database; only a key identifier is
stored. Rotation requires an overlap window. Irrecoverable loss of the last
usable pepper requires password reset. Pepper behavior needs cross-adapter
vectors before enablement.

## Alternatives Considered

A native-only implementation was rejected because it makes credentials depend
on binary availability and CPU architecture. A portable-only implementation was
rejected because native code offers materially better production performance.
PBKDF2 may be required by a future compliance profile but is not memory-hard.
Runtime-specific hash formats were rejected because deployments and rolling
upgrades must never invalidate credentials.

## Security and Privacy Impact

Unique salts come from the cryptographic random adapter. Comparisons cover the
complete fixed-length output. PHC parsing is bounded before expensive work.
Passwords, transient salts, derived bytes, peppers, and PHC strings are never
logged or traced.

Authentication also requires distributed rate limits, credential-stuffing
defenses, breached-password policy, generic responses, and admission control.
In-process semaphores are not distributed protection. Plaintext passwords are
never queued or persisted; hashing occurs inside the selected deployment.

## Portability and Operational Impact

Every accepted hash is verified by both adapters in CI. Docker images include
the portable fallback and report native-adapter readiness without exposing
credential data. No hosted hashing service is required.

Release tests record p50 and p95 hash/verify latency, memory, CPU, and concurrency
on supported Docker architectures. Regression ceilings are evidence thresholds,
not user-facing SLOs.

## Validation

Production packages retain:

1. the Argon2id RFC 9106 vector;
2. portable-to-native and native-to-portable verification;
3. correct, incorrect, Unicode, maximum, and over-limit password cases;
4. malformed, unsupported, oversized, and downgraded PHC cases;
5. complete first-party coverage;
6. direct Node.js and built-Docker execution;
7. latency and memory regression measurements; and
8. rehash, pepper rotation, concurrency, and legacy-import tests when added.

## Review Triggers

- OWASP raises its minimum Argon2id profile.
- Either selected library becomes unmaintained or vulnerable.
- Supported Node.js or CPU architectures change cryptographic behavior.
- Production measurements exceed latency, memory, or abuse-capacity budgets.
- A compliance-specific hashing profile is required.

## References

- [Argon2, RFC 9106](https://www.rfc-editor.org/rfc/rfc9106)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [`@noble/hashes`](https://github.com/paulmillr/noble-hashes)
- [`@node-rs/argon2`](https://github.com/napi-rs/node-rs)
