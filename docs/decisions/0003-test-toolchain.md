# ADR-0003: TypeScript Test Toolchain

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Platform engineering
- **Related tasks:** DEC-004, FND-008 through FND-012
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform requires deterministic tests across runtime-neutral packages,
Cloudflare Workers, Node/Docker, React components, browsers, SQL dialects, and
security protocols. Executable first-party TypeScript must maintain complete
line, statement, function, and branch coverage, while skipped or flaky tests
must fail rather than be hidden by retries.

## Decision

Use one TypeScript-first family of tools with separate environments:

| Layer | Tool |
| --- | --- |
| Unit, schema, contract, adapter, and repository tests | Vitest 4.1.10 |
| Node coverage | `@vitest/coverage-v8` 4.1.10 |
| Workers runtime tests | `@cloudflare/vitest-pool-workers` 0.18.8 |
| React component tests | Vitest Browser Mode with Playwright |
| End-to-end browser tests | Playwright Test 1.61.1 |
| Compile-time contract tests | `tsc --noEmit` fixtures and Vitest `expectTypeOf` |
| Accessibility assertions | Testing Library queries plus axe-core checks |

### Unit and Package Tests

- Vitest projects separate Node, browser, Workers, integration, and type suites.
- Tests import APIs explicitly; globals remain disabled.
- Fake time, deterministic random sources, and fixture builders are shared
  packages rather than ad hoc global mutation.
- Unit tests have no network dependency.
- Focused, skipped, todo, or concurrent tests that undermine deterministic
  state fail repository policy checks.

### Coverage

- V8 coverage is the primary Node and Chromium coverage provider.
- Thresholds are 100% for lines, statements, functions, and branches.
- Coverage includes all executable first-party TypeScript, including files not
  imported by a test.
- Generated and third-party paths are the only automatic exclusions.
- Workers-specific suites prove runtime behaviour separately because the
  Workers runtime does not expose V8 coverage collection.
- Runtime-neutral logic stays outside Workers entry points so its branches are
  covered under Node or browser instrumentation as well as exercised in Workers.

### Component and Browser Tests

- Component tests run in a real headless Chromium browser through Vitest Browser
  Mode and the Playwright provider.
- Playwright end-to-end projects cover Chromium, Firefox, and WebKit.
- Component tests use user-visible queries and real interactions rather than
  implementation details.
- Keyboard, focus, loading, empty, success, error, reduced-motion, and automated
  accessibility checks are required where relevant.

### Reliability Rules

- CI retries are disabled for unit, component, integration, and end-to-end tests.
- Tests control time, randomness, identifiers, external responses, and data.
- Parallel tests receive isolated databases, namespaces, ports, and object keys.
- Failures retain bounded logs, Playwright traces, screenshots, and test reports
  with secrets and personal data redacted.
- Sandbox or live-provider tests are opt-in and never replace deterministic
  conformance tests.

## Alternatives Considered

### Jest

Jest has a mature ecosystem but was not selected because Vitest aligns directly
with Vite, provides ESM-first TypeScript support, browser projects, and a
Workers integration maintained for the target runtime.

### DOM Emulation for All Components

Using only jsdom would be faster, but it cannot provide enough confidence for
focus, browser APIs, CSS-dependent behaviour, or Workers-compatible Web APIs.
Small pure UI utilities may still use a simulated DOM when no browser behaviour
is involved.

### Playwright for Every Test

Running all logic through browsers would be slow and make deterministic domain
testing harder. Playwright is reserved for component-browser and full journey
coverage.

### Automatic Test Retries

Retries were rejected because they hide nondeterminism and conflict with the
requirement that flaky tests are defects.

## Security Impact

Real Workers and browser execution exposes runtime-specific security mistakes.
Complete coverage and denied-path assertions make missing authorization branches
visible. Artifact redaction prevents traces and reports from becoming a secret
or personal-data leak.

## Privacy and Residency Impact

Automated fixtures contain synthetic identities only. Live integration tests
must use approved sandbox data and regions. CI artifacts follow retention and
redaction policy.

## Portability and Self-Hosting Impact

The same behavioural suites run against Workers and Docker artifacts. Core
tests do not require a hosted service, and self-hosted adapters use the same
conformance harnesses.

## Operational Impact

Fast unit suites run on affected packages. Runtime, browser, database, and
end-to-end suites run when their dependency graph changes and in the full
milestone gate. Failure artifacts are reproducible locally.

## Consequences

- Most contributors learn one assertion and mocking API.
- Browser and Workers suites add installation and CI runtime cost.
- Complete coverage requires deliberate exclusion management and test design.
- Runtime-neutral design is reinforced by testing logic outside entry points.

## Validation

- Prove a sample package fails each coverage threshold when a branch is removed.
- Run a shared Hono route suite in Node and the Workers pool.
- Run a React component in Vitest Browser Mode.
- Run Playwright journeys in Chromium, Firefox, and WebKit.
- Prove focused, skipped, and retried tests are rejected by repository policy.

## Review Triggers

- A selected tool drops a supported runtime.
- Workers integration cannot execute a required API.
- Coverage mapping produces demonstrably incorrect results.
- Browser-mode limitations prevent required accessibility or interaction tests.
- CI duration exceeds the reliability target after affected-task filtering.

## References

- [Vitest features](https://vitest.dev/guide/features)
- [Vitest coverage](https://vitest.dev/guide/coverage)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Playwright test configuration](https://playwright.dev/docs/test-configuration)
