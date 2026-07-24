# ADR-0004: Hono API Contracts

- **Status:** Accepted
- **Date:** 2026-07-23
- **Last updated:** 2026-07-24
- **Owners:** Platform engineering
- **Related tasks:** DEC-005, API-001 through API-018
- **Supersedes:** None
- **Superseded by:** None

## Context

The public, management, and internal APIs require shared runtime validation,
strong TypeScript contracts, complete OpenAPI documentation, generated clients,
and one production behavior in every Docker deployment. Maintaining separate
route, schema, type, and documentation definitions would create dangerous drift.

## Decision

Use Hono with `@hono/zod-openapi` and Zod 4:

- Define path, query, header, body, success, and expected error schemas in Zod.
- Register routes with `createRoute` and `OpenAPIHono.openapi`.
- Give every operation a stable `operationId`, summary, tags, and description.
- Export the composed application type for same-repository clients through
  Hono's inferred client.
- Generate OpenAPI 3.1 from registered routes for public SDK generation and
  breaking-change checks.
- Serve the application on Node.js through `@hono/node-server`.
- Package and run the same entry point in Docker for hosted and self-hosted use.
- Keep deployment configuration and adapter selection outside route contracts.

The executable proof in `tooling/hono-contract-spike` starts a real Node.js HTTP
listener, calls it through an inferred client, rejects invalid input, and checks
the generated OpenAPI operation and named component schema.

## Contract Rules

- Undocumented success or failure bodies are defects.
- Literal response statuses remain available for typed narrowing.
- Shared error contracts replace framework-specific validation shapes before
  production endpoints are added.
- API packages export composed route types, not internal handlers or services.
- OpenAPI is the language-neutral public contract; inferred TypeScript clients
  are a convenience.
- Large APIs compose small typed sub-applications to keep inference fast and
  source files within the repository line limit.
- The same black-box suite runs directly against Node.js and the built image.

## Alternatives Considered

Plain Hono plus separate OpenAPI files duplicates schemas. Decorator-heavy
controllers add metadata and lifecycle abstractions the platform does not need.
Generating server routes from OpenAPI complicates domain composition and local
type inference, although generated external clients remain required. A broader
Standard Schema integration can be revisited if it offers materially stronger
OpenAPI support.

## Security, Privacy, and Portability

Runtime validation occurs at the HTTP boundary. Explicit output contracts expose
accidental data disclosure during review and documentation generation, but do
not replace authorization, projection, or protocol conformance.

Contracts identify personal-data boundaries. Tooling runs locally. The Node.js
application uses Web-standard requests and responses where practical, while the
released Docker image defines the sole deployment contract for hosted and
self-hosted installations.

## Consequences

- Zod schemas are compatibility-sensitive API assets.
- Hono and its OpenAPI integration must be upgraded together.
- Client bodies can be unions across response statuses and require narrowing.
- Docker image and reverse-proxy tests are mandatory release evidence.

## Validation

The retained spike proves validation, OpenAPI 3.1 generation, stable operation
metadata, inferred client types, and real Node.js HTTP execution:

```text
pnpm --filter @expressthat-auth/hono-contract-spike build
pnpm --filter @expressthat-auth/hono-contract-spike test:coverage
```

Production API tasks add built-image and multi-replica black-box tests.

## Review Triggers

- A required OpenAPI 3.1 feature cannot be represented accurately.
- Hono inference materially degrades typecheck performance.
- Direct Node.js and built-image behavior diverge.
- A maintained Standard Schema integration offers stronger compatibility.

## References

- [Hono Zod OpenAPI example](https://hono.dev/examples/zod-openapi)
- [Hono Node adapter](https://hono.dev/docs/getting-started/nodejs)
