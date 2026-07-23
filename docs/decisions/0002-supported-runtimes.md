# ADR-0002: Supported Runtimes and Language Versions

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Platform engineering
- **Related tasks:** DEC-003, FND-001, FND-003
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform must run the same runtime-neutral application code on Cloudflare
Workers and Node.js in Docker. Contributors, CI, generated SDKs, and browser
applications need explicit compatibility targets so newer local tools cannot
silently introduce unsupported features.

## Decision

### Node.js

- Node.js 24.18.0 LTS is the minimum and production Docker baseline.
- Node.js 26.x Current is a forward-compatibility CI target until it enters LTS.
- Root manifests use `>=24.18.0 <27` during this transition.
- CI runs the complete quality suite on Node.js 24 and a focused
  forward-compatibility suite on Node.js 26.
- Production images pin a full Node.js version and digest, then receive routine
  security updates within the supported major.

When Node.js 26 becomes LTS, an ADR review will decide when it becomes the
production baseline. Dropping Node.js 24 requires a documented major support
change.

### Cloudflare Workers

- Worker deployments pin an explicit compatibility date.
- New Workers start with the current compatibility date at implementation time.
- Compatibility-date updates are reviewed monthly and require Workers
  conformance, protocol, and deployment smoke tests.
- Runtime-neutral packages use Web APIs and do not rely on `nodejs_compat`.
- A runtime adapter may use a reviewed compatibility feature when the same
  capability remains available through a Node/Docker adapter.

### TypeScript and JavaScript Output

- Start with TypeScript 7.0.2 pinned exactly at the workspace root.
- All packages extend strict shared configurations.
- Runtime-neutral server packages target modern Web APIs and ES2022-compatible
  output unless a build target requires a stricter setting.
- TypeScript upgrades are explicit, run all type tests, and cannot weaken strict
  compiler options to obtain a passing build.

### Browsers

- Vite's Baseline Widely Available target is the default browser build target.
- Browser acceptance tests cover current Chromium, Firefox, and WebKit engines.
- The hosted authentication UI must remain usable on the previous major Safari
  and iOS Safari generation where the required WebAuthn capability exists.
- Legacy browsers without native modules are not an initial product target.
- Accessibility and security fixes take priority over supporting an obsolete
  browser engine.

## Alternatives Considered

### Node.js 26 Only

The development machine already runs Node.js 26. It was not selected as the
production baseline because it remains a Current release until October 2026.

### Node.js 22 as the Minimum

Node.js 22 remains supported upstream, but using Node.js 24 as the initial
baseline provides a longer runway for a new platform and aligns with current
tooling while retaining an LTS production runtime.

### Unpinned Workers Compatibility

Relying on dashboard defaults was rejected because behaviour could differ
between environments and could not be reproduced from source control.

### Custom Legacy Browser Target

A broader transpilation and polyfill policy was rejected initially because the
authentication UI depends on modern security APIs and Vite already defines a
clear modern baseline.

## Security Impact

Using an LTS production runtime provides security fixes without relying on a
Current release. Exact production image and compiler pins make builds
reproducible. Forward testing catches upcoming runtime changes. Workers
compatibility updates cannot bypass protocol and security suites.

## Privacy and Residency Impact

Runtime versions do not change the European data boundary. A Workers
compatibility update requires review if it alters logging, subrequests,
cryptography, storage, or execution placement.

## Portability and Self-Hosting Impact

Self-hosted Docker operators receive the Node.js 24 production baseline. Shared
packages cannot use Node-only APIs, so support for Workers does not require
Cloudflare emulation in Docker. Browser and SDK output remains ordinary
standards-based JavaScript.

## Operational Impact

CI maintains a small runtime matrix. Dependency upgrades must satisfy the
minimum Node.js version. Runtime and compatibility-date updates are scheduled
maintenance rather than incidental changes.

## Consequences

- Developers on Node.js 24 or 26 can work on the repository.
- Production avoids a non-LTS Node.js baseline.
- New JavaScript features may require build transformation or a later baseline.
- Worker behaviour is reproducible from committed deployment configuration.

## Validation

- Run install, typecheck, tests, and builds on Node.js 24.
- Run forward-compatibility tests on Node.js 26.
- Run Workers conformance using the committed compatibility date.
- Run browser component and end-to-end suites on Chromium, Firefox, and WebKit.

## Review Triggers

- Node.js 26 enters LTS.
- Node.js 24 enters maintenance or approaches end of life.
- A required dependency drops Node.js 24.
- TypeScript or Vite changes its runtime or output requirements.
- A Workers compatibility update changes a used API.
- Product requirements add a legacy browser target.

## References

- [Node.js 24.18.0 LTS release](https://nodejs.org/en/blog/release/v24.18.0)
- [Node.js 26 release schedule](https://nodejs.org/en/blog/release/v26.0.0)
- [Cloudflare Workers compatibility dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/)
- [Vite browser compatibility](https://vite.dev/guide/build#browser-compatibility)
