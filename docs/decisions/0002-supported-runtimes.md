# ADR-0002: Supported Runtimes and Language Versions

- **Status:** Accepted
- **Date:** 2026-07-23
- **Last updated:** 2026-07-24
- **Owners:** Platform engineering
- **Related tasks:** DEC-003, FND-001, FND-003
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform needs one reproducible server runtime and deployment format for
hosted and self-hosted installations. Contributors, CI, generated SDKs, and
browser applications also need explicit compatibility targets so newer local
tools cannot silently introduce unsupported features.

The project initially planned more than one server deployment runtime. That
increased dependencies, configuration, testing combinations, adapter
constraints, and operational surface without being required by the product.
The decision was narrowed on 2026-07-24 before production implementation.

## Decision

### Node.js and Docker

- Node.js 24.18.0 LTS is the minimum and production baseline.
- Node.js 26.x Current is a forward-compatibility CI target until it enters LTS.
- Root manifests use `>=24.18.0 <27` during this transition.
- Production runs only in unprivileged Linux containers.
- Production images pin a full Node.js version and immutable base-image digest.
- APIs use Hono through `@hono/node-server`.
- Browser applications are built once with Vite and served from an unprivileged
  container or the same deployment's approved reverse proxy.
- Hosted and self-hosted products use the same versioned Docker artifacts.

When Node.js 26 becomes LTS, an ADR review will decide when it becomes the
production baseline. Dropping Node.js 24 requires a documented major support
change.

### TypeScript and JavaScript output

- TypeScript 7.0.2 remains pinned exactly at the workspace root.
- All packages extend strict shared configurations.
- Server packages target the supported Node.js baseline and ES2022-compatible
  output.
- Runtime-neutral domain and contract packages still avoid unnecessary
  deployment imports so they remain testable and maintainable.
- TypeScript upgrades are explicit, run all type tests, and cannot weaken strict
  compiler options to obtain a passing build.

### Browsers

- Vite's Baseline Widely Available target is the default browser build target.
- Browser acceptance tests cover current Chromium, Firefox, and WebKit engines.
- The hosted authentication UI remains usable on the previous major Safari and
  iOS Safari generation where the required WebAuthn capability exists.
- Legacy browsers without native modules are not an initial product target.
- Accessibility and security fixes take priority over supporting an obsolete
  browser engine.

## Alternatives considered

### Multiple server deployment runtimes

Rejected because the additional runtime did not provide required product
behavior and multiplied compatibility, security, dependency, deployment, and
support work. Infrastructure portability is provided by Docker and adapter
contracts instead.

### Node.js 26 only

The development machine already runs Node.js 26. It was not selected as the
production baseline because it remains a Current release until October 2026.

### Node.js 22 as the minimum

Node.js 22 remains supported upstream, but Node.js 24 provides a longer runway
for a new platform and aligns with the pinned toolchain.

### Custom legacy browser target

A broader transpilation and polyfill policy was rejected initially because the
authentication UI depends on modern security APIs and Vite already defines a
clear modern baseline.

## Security impact

One server runtime reduces dependency and configuration surface, removes an
entire deployment trust boundary, and makes security testing more focused.
Unprivileged containers, immutable image digests, minimal images, read-only
filesystems, dropped capabilities, and controlled termination become mandatory
deployment controls. Multi-instance, reverse-proxy, and adapter conformance
remain required.

## Privacy and residency impact

The hosted operator places containers, databases, queues, objects, logs,
backups, and subprocessors only in approved European locations. Docker itself
does not provide residency. Self-hosted operators choose their own
infrastructure and regions and remain responsible for their legal obligations.

## Portability and self-hosting impact

Docker is the single supported distribution and deployment method. Operators
can run it on any compatible container platform and select conforming database
and infrastructure adapters. The project does not promise support for
platform-specific serverless runtimes or proprietary bindings.

## Operational impact

CI maintains Node.js, browser, container, reverse-proxy, multi-instance, and
supported architecture matrices. Dependency upgrades must satisfy the minimum
Node.js version. Image and runtime upgrades are scheduled maintenance rather
than incidental changes.

## Consequences

- The deployment workspace contains only Docker composition and packaging.
- Server packages may use supported Node.js APIs through explicit boundaries.
- Platform-specific runtime dependencies, types, configuration, and tests are
  removed.
- Hosted and self-hosted documentation describe the same artifact with
  different operator responsibility and service commitments.
- Horizontal scaling still requires shared durable state and safe competing job
  consumers.

## Validation

- Run install, typecheck, tests, and builds on Node.js 24.
- Run forward-compatibility tests on Node.js 26.
- Build the production image reproducibly and scan it.
- Run black-box API, browser, reverse-proxy, graceful-shutdown, and
  multi-instance suites against the image.
- Run browser component and end-to-end suites on Chromium, Firefox, and WebKit.

## Review triggers

- Node.js 26 enters LTS.
- Node.js 24 enters maintenance or approaches end of life.
- A required dependency drops Node.js 24.
- TypeScript or Vite changes its runtime or output requirements.
- Product requirements add a legacy browser target or a different supported
  deployment format.

## References

- [Node.js 24.18.0 LTS release](https://nodejs.org/en/blog/release/v24.18.0)
- [Node.js 26 release schedule](https://nodejs.org/en/blog/release/v26.0.0)
- [Dockerfile reference](https://docs.docker.com/reference/dockerfile/)
- [Vite browser compatibility](https://vite.dev/guide/build#browser-compatibility)
