# ADR-0003: TypeScript Test Toolchain

- **Status:** Accepted
- **Date:** 2026-07-23
- **Last updated:** 2026-07-24
- **Owners:** Platform engineering
- **Related tasks:** DEC-004, FND-008 through FND-012
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform requires deterministic tests across Node.js services, built Docker
images, React components, browsers, SQL dialects, adapters, and security
protocols. Executable first-party TypeScript must maintain complete line,
statement, function, and branch coverage. Skipped, focused, retried, or flaky
tests must fail rather than being hidden.

## Decision

Use one TypeScript-first family of tools with purpose-specific environments:

| Layer | Tool |
| --- | --- |
| Unit, schema, contract, adapter, and repository tests | Vitest |
| Node.js coverage | `@vitest/coverage-v8` |
| React component tests | Vitest Browser Mode with Playwright |
| End-to-end browser tests | Playwright Test |
| Compile-time contract tests | `tsc --noEmit` fixtures and Vitest `expectTypeOf` |
| Accessibility assertions | Testing Library queries plus axe-core checks |

Node.js tests cover domain, API, adapter, integration, and runtime behavior.
Docker black-box projects run shared HTTP journeys against the exact built image.
Multi-replica projects place at least two containers behind the supported reverse
proxy and verify shared-state, concurrency, rollout, and trusted-proxy behavior.

Vitest globals remain disabled. Unit tests have no network dependency. Shared
fixtures control time, randomness, identifiers, external responses, namespaces,
ports, and object keys. Live-provider tests are opt-in and never replace
deterministic adapter conformance.

## Coverage and Browser Rules

- V8 is the primary Node.js and Chromium coverage provider.
- Thresholds are 100% for lines, statements, functions, and branches.
- Coverage includes unimported executable first-party TypeScript.
- Only generated and third-party code receives automatic exclusions.
- Component tests use real Chromium interactions and user-visible queries.
- End-to-end projects cover Chromium, Firefox, and WebKit.
- Keyboard, focus, reduced-motion, loading, empty, success, error, and automated
  accessibility behavior are tested where relevant.

CI retries are disabled. Bounded logs, traces, screenshots, and reports must
redact secrets and personal data.

## Alternatives Considered

Jest was not selected because Vitest aligns with Vite, ESM-first TypeScript,
browser projects, and the repository task graph. DOM emulation alone cannot
cover real focus, CSS, browser API, or accessibility behavior. Running every
test in Playwright would make fast deterministic domain testing unnecessarily
slow. Automatic retries were rejected because they conceal nondeterminism.

## Security, Privacy, and Portability

Built-image and multi-replica execution expose packaging, proxy, header, cookie,
shared-state, and deployment mistakes. Complete coverage and denied-path
assertions make missing authorization branches visible. Fixtures are synthetic;
artifacts follow redaction and retention policy.

All core and adapter suites run locally without a hosted dependency. Hosted and
self-hosted editions use the same Docker artifacts and conformance harnesses.

## Consequences

- Contributors use one primary assertion and mocking API.
- Browser, database, image, and replica suites add CI cost.
- Complete coverage requires deliberate test design.
- The built artifact, not an alternate development entry point, is the release
  evidence.

## Validation

- Prove a sample package fails every coverage threshold when a branch is removed.
- Run a shared Hono suite directly in Node.js and against the built Docker image.
- Run the image behind a reverse proxy with multiple replicas.
- Run component tests in browser mode and journeys in all supported browsers.
- Prove focused, skipped, retried, and flaky tests are rejected.

## Review Triggers

- A selected tool drops a supported Node.js or browser version.
- Coverage mapping is demonstrably incorrect.
- Browser-mode limitations prevent required accessibility or interaction tests.
- Container tests do not reproduce the released artifact.
- CI duration exceeds the target after affected-task filtering.

## References

- [Vitest features](https://vitest.dev/guide/features)
- [Vitest coverage](https://vitest.dev/guide/coverage)
- [Vitest Browser Mode](https://vitest.dev/guide/browser/)
- [Playwright test configuration](https://playwright.dev/docs/test-configuration)
