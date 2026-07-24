# Test Configuration and Security Harnesses

This runtime-neutral workspace owns shared Vitest and Playwright configuration,
safe synthetic fixtures, schema assertions, deterministic clocks/randomness,
and reusable adversarial security-test harnesses. Feature packages import these
utilities; production code must not depend on this workspace.

## Public exports

- `.` — fixtures, deterministic utilities, schemas, and adversarial harnesses.
- `./adversarial` — hostile corpora, property campaigns, parser limits,
  concurrency/replay drivers, redaction assertions, replica-state conformance,
  and Docker replica differential runners.
- `./component` — accessible React component-test configuration.
- `./playwright` — cross-browser Playwright defaults.
- `./setup-dom` — DOM matcher setup.
- `./vitest` — mandatory 100% per-file coverage defaults.

## Adversarial workflow

Every feature package selects relevant hostile corpus entries and adds
feature-specific regression seeds. Parser tests define explicit length, depth,
count, and semantic limits. Property failures print the deterministic seed and
iteration so the exact case can be replayed before it is preserved as a named
regression test.

Tenant-sensitive packages use `FixtureFactory.isolationFixture()` to obtain two
tenants with separate development and production environments. Tests must
attempt cross-tenant and cross-environment access rather than relying only on
different identifiers.

Concurrency and replay drivers release attempts through one barrier and retain
fulfilled and rejected outcomes for invariant assertions. They model duplicate
execution; they are not a substitute for multi-process or database concurrency
tests.

Redaction assertions use `SyntheticSecret` canaries and never include a leaked
value in their own failure message. Runtime security cases send fresh requests
to independent Docker targets, normalize explicitly allowed dynamic fields, and
fail on observable differences.

`ReplicaStateConformanceSuite` requires bounded primary/secondary probes for
authorization, job ownership, locks, nonces, rate limits, sessions, and tenant
caches. It rejects incomplete definitions, separate process-local behavior,
thrown probes, and timeouts with normalized diagnostics. Feature packages wrap
their public service behavior; the deterministic shared/separate memory fixture
only proves the harness itself.

## Commands and tests

- `pnpm --filter @expressthat-auth/test-config build`
- `pnpm --filter @expressthat-auth/test-config test`
- `pnpm --filter @expressthat-auth/test-config test:coverage`
- `pnpm --filter @expressthat-auth/test-config test:e2e`
- `pnpm --filter @expressthat-auth/test-config test:types`

The harness has unit and type-contract coverage. Browser runners retain failure
artifacts under ignored `test-results/` and `playwright-report/` directories.

## Security and privacy

Fixtures use reserved `.test` identities, visible synthetic names, deterministic
identifiers, and non-production secret canaries. Never insert real personal
data, production payloads, credentials, hashes, tokens, or provider responses
into tests or snapshots.

Campaign sizes are bounded so ordinary commits remain deterministic and
resource-safe. Larger fuzz, dynamic, race, and soak campaigns run in the
continuous-security tasks with preserved seeds and the same core harnesses.

## Runtime and extension boundaries

The core utilities use Web-platform APIs supported by modern Node.js.
Node-only DOM/browser setup remains in its named subpath. Add a shared harness
only when several feature packages need the same invariant; keep product
semantics and provider-specific behavior in their owning conformance packages.

## Further documentation

- [Testing and maintainability requirements](../../AUTH_SOLUTION_OVERVIEW.md#313-testing-and-maintainability-enforcement)
- [Living threat model](../../docs/security/threat-model.md)
- [Adversarial testing toolkit](../../docs/security/adversarial-testing-toolkit.md)
- [Data classification](../../docs/security/data-classification.md)
