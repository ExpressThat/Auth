# Adversarial Testing Toolkit

The shared `@expressthat-auth/test-config/adversarial` entry point makes hostile
and denied testing a normal part of each feature rather than a final security
phase. It is deterministic, runtime-neutral, safe for ordinary commits, and
designed to scale into the later scheduled security campaigns.

## Required use

Feature packages select the harnesses that match their trust boundaries:

- Parsers and schemas use named hostile corpus entries, exact byte/depth/count
  limits, valid boundary cases, and invalid over-boundary cases.
- Canonicalization and state-machine rules use deterministic property campaigns
  with preserved failure seeds.
- Tenant or environment behavior uses the two-tenant fixture and attempts the
  same identifier, membership, cursor, token, cache, export, or mutation across
  both tenants and development/production environments.
- Consumable, idempotent, rotating, or optimistic operations use concurrency
  and replay attempts and assert exactly the allowed outcomes.
- Logs, errors, events, audits, traces, exports, diagnostics, and provider
  failures use synthetic-secret redaction assertions.
- Runtime-sensitive HTTP behavior uses the Docker replica differential runner
  and compares denial, status, security headers, cookies, redirects, cache
  policy, and safe body behavior.

Passing a shared harness is not sufficient on its own. Every feature adds
domain-specific malicious cases and preserves each discovered defect as a named
regression input.

## Hostile corpora

`HOSTILE_TEXT_CORPUS` includes encoding ambiguity, NUL, bidi control, combining
marks, lone surrogate, SQL control text, template and HTML injection, path
traversal, prototype-like keys, and header splitting. `createLimitCorpus`
creates exact one-over length and depth inputs without committing oversized
fixtures.

Corpora contain no real exploit target, credential, personal data, or production
payload. New entries require a stable identifier, threat category, owning
control, and tests proving safe failure.

## Parser limits

`enforceJsonParserLimits` measures UTF-8 bytes with `TextEncoder` and nesting
depth while ignoring quoted delimiters and respecting escapes. Mismatched,
unterminated, or negative structure is treated as unbounded/invalid.

The limit harness complements rather than replaces the real parser:

1. Enforce transport byte limits before buffering expensive bodies.
2. Enforce structural depth/count limits before domain work.
3. Parse syntax through the selected standards-compliant implementation.
4. Runtime-validate semantics, formats, ownership, freshness, and purpose.
5. Assert accepted and rejected boundary cases through
   `assertParserLimitCases`.

Limits are declared per contract. A shared default cannot silently expand a
security-sensitive endpoint.

## Property and fuzz campaigns

`DeterministicRandom` uses an explicit non-zero 32-bit seed and bounded integer,
selection, and text operations. `runPropertyCampaign` reports only seed and
iteration when an invariant fails, avoiding accidental inclusion of generated
secrets or personal-like data.

Ordinary tests use small deterministic campaigns. When a campaign finds a
failure:

1. replay the same seed and iteration;
2. minimize the input without removing the failure;
3. add a named regression test containing safe synthetic data; and
4. retain the broader invariant campaign.

Scheduled campaigns may use more seeds and iterations, isolated resource
budgets, and persisted machine-readable findings. They use the same invariant
functions so commit and scheduled evidence cannot drift.

## Tenant and environment isolation

`FixtureFactory.isolationFixture()` creates:

- a primary and secondary tenant;
- a visibly synthetic user in each tenant; and
- development and production environments scoped to each tenant.

Tests must derive trusted scope through the behavior under test. Merely passing
different IDs does not prove isolation. Denied counterparts deliberately mix
tenant, environment, application, membership, token audience, cursor, cache
key, and repository identifiers and assert non-enumerating, fail-closed results.

## Concurrency and replay

`runConcurrentAttempts` releases two to 1,000 attempts through one barrier and
captures fulfilled or rejected outcomes by stable index. `runReplayAttempts`
passes the exact same input object to every attempt.

Feature assertions define the invariant, for example:

- one authorization code or recovery token consumes successfully;
- one idempotent side effect is committed and compatible replays observe it;
- stale optimistic writes fail;
- duplicate jobs do not duplicate an external effect; and
- rotation creates one active successor without accepting the predecessor
  outside its documented overlap.

The in-process driver makes races reproducible but does not prove distributed
correctness. Database, multiple-instance, queue-redelivery, and Docker
campaigns remain required by their later tasks.

## Redaction assertions

`assertRedactedOutput` serializes a diagnostic value, rejects any raw
`SyntheticSecret`, and requires `[REDACTED]` by default. Its own failure messages
never echo the canary. Callers can disable the marker requirement only when the
entire sensitive field is intentionally omitted.

Redaction tests must cover every new classified field at each output sink.
Serialization failure is a test failure, not permission to log a fallback
inspection string.

## Docker replica differential runner

`runDockerReplicaSecurityCases` requires correctly named primary and secondary
Docker targets and creates a fresh `Request` for each target. It compares status, safe
body, and security-relevant response headers. A case can normalize an explicitly
documented dynamic value such as a request ID; broad normalization that hides
semantic differences is prohibited.

The runner is suitable for in-process Node adapters and black-box deployed
Docker targets. Runtime setup remains owned by the consuming package.

## Replica-state conformance

`ReplicaStateConformanceSuite` gives each probe distinct primary and secondary
replica identities and requires complete authorization, job-ownership, lock,
nonce, rate-limit, session, and tenant-cache coverage. False, rejected, and
timed-out probes are normalized without retaining the thrown diagnostic.

Feature probes must call the public repository, service, API, or job behavior
being qualified. The deterministic shared-backend fixture proves the harness;
it does not qualify a production adapter. A feature that depends on shared
state also runs outage, restart, eviction, atomic race, tenant-isolation, and
built-Docker variants before its deployment gate is complete.

## Resource safety and evidence

- Commit campaigns are deterministic, bounded, and offline.
- Generated over-limit data is not committed.
- Failures record seed/case identifiers, not unsafe payloads.
- No harness uses production credentials or customer data.
- No suppression is accepted without owner, reason, scope, expiry, and durable
  regression evidence.
- Larger scheduled campaigns are implemented by SEC-031 and continuous scan
  orchestration by FND-022.
