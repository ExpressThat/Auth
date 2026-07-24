# Task Review Checklist

Use this checklist before every task-sized commit. It applies even when one
person authors and commits the work because the repository does not use pull
requests as its internal progress unit.

## Scope and architecture

- [ ] The task dependency is complete and the diff satisfies its exact
      acceptance condition.
- [ ] Changes are owned by the correct workspace and preserve the dependency
      direction.
- [ ] Runtime-neutral packages do not import provider, database,
      application, or deployment implementations.
- [ ] Infrastructure remains behind capability contracts and does not make
      hosted infrastructure mandatory for self-hosting.
- [ ] No authoritative cross-request state relies on one process instance.
- [ ] Docker replicas, supported database dialects, tenant environments,
      and hosted/self-hosted boundaries were evaluated.
- [ ] A changed binding decision has an added or superseding ADR.

## Security and privacy impact

- [ ] Assets, actors, trust boundaries, entry points, and abuse cases were
      identified.
- [ ] Boundary data is runtime-validated with bounded size, depth, count,
      format, ownership, purpose, and freshness.
- [ ] Authentication, authorization, tenant/environment isolation,
      enumeration, replay, concurrency, and partial failure fail closed.
- [ ] Logs, errors, traces, events, audits, exports, and diagnostics cannot
      expose secrets or unnecessarily expose personal data.
- [ ] Collection, retention, export, correction, restriction, objection,
      erasure, residency, and subprocessor effects were evaluated.
- [ ] No production credential, customer data, personal data, bypass,
      default password, master key, or hidden support access was introduced.
- [ ] The threat model, classification, standards, support, or privacy
      documentation was updated when the control or risk changed.

## Tests and compatibility

- [ ] New behavior has success, denial, malformed-input, boundary, and
      dependency-failure tests.
- [ ] Scoped behavior uses at least two tenants and multiple environments.
- [ ] Replay, race, property, hostile-input, redaction, and resource-exhaustion
      tests were added where relevant.
- [ ] Public TypeScript and OpenAPI contracts have compile-time, runtime, and
      compatibility evidence.
- [ ] Runtime-sensitive behavior has built-image and multi-replica evidence.
- [ ] Database behavior passes shared conformance against each supported
      adapter.
- [ ] Every bug or security fix has a named regression test.
- [ ] Tests are deterministic, bounded, isolated, parallel-safe, and contain
      no skip, focus, quarantine, retry masking, or real secret.
- [ ] First-party executable TypeScript retains 100% statements, branches,
      functions, and lines per file.

## Maintainability and documentation

- [ ] No non-exempt first-party file exceeds 250 physical lines.
- [ ] Public exports are intentional; types and errors remain stable and
      documented.
- [ ] Package and product documentation changed alongside the implementation.
- [ ] Developer, administrator, end-user, security/privacy, operator, and
      support audiences were evaluated.
- [ ] Examples are safe and distinguish planned from implemented behavior.
- [ ] Hosted commitments are not presented as open-source or self-hosted
      guarantees.
- [ ] A complete change fragment exists, or task evidence explains why none is
      release-relevant.
- [ ] Task completion evidence states the tests and gates actually run.

## Local evidence

Run all applicable commands:

```bash
pnpm format:check
pnpm check
pnpm lint
pnpm typecheck
pnpm test:types
pnpm test
pnpm test:coverage
pnpm build
pnpm scan:artifacts
pnpm scan:licenses
pnpm scan:dependencies
git diff --check
```

Add `check:contracts`, generation drift, database, browser, deployment,
container, and Docker replica commands when affected. Inspect the complete diff
and repository status before staging. A passing command does not waive a
missing security, privacy, portability, or documentation review.
