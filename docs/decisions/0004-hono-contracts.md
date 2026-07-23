# ADR-0004: Hono API Contracts

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Platform engineering
- **Related tasks:** DEC-005, API-001 through API-018
- **Supersedes:** None
- **Superseded by:** None

## Context

The public, management, and internal APIs must share validation and response
contracts across Cloudflare Workers and Node/Docker. They also require complete,
versioned OpenAPI documents and useful TypeScript client types without maintaining
parallel route, schema, and documentation definitions.

## Decision

Use Hono with `@hono/zod-openapi` and Zod 4 as the initial contract system:

- Define request parameters, query strings, headers, bodies, success responses,
  and expected error responses with named Zod schemas.
- Register routes with `createRoute` and `OpenAPIHono.openapi`.
- Give every operation a stable `operationId`, summary, tags, and descriptions.
- Export the composed Hono application type for same-repository TypeScript
  clients through Hono's `hc` client.
- Generate OpenAPI 3.1 from the registered routes; the generated document is the
  source for public SDK generation and breaking-change checks.
- Export the same application as a Workers module and pass its `fetch` handler to
  `@hono/node-server` for Node/Docker.
- Keep runtime bindings and environment access outside route contracts.

The executable regression proof lives in
`tooling/hono-contract-spike`. It starts a real Node HTTP listener, runs the same
route in Workerd, calls it through an inferred client, tests invalid input, and
asserts the generated OpenAPI operation and component schema.

### Contract Rules

- Route schemas are explicit; undocumented success or failure bodies are defects.
- Response status literals are preserved so typed clients can narrow response
  unions before parsing a body.
- Shared errors will replace the spike's framework validation shape before
  production endpoints are added.
- API packages export composed route types, not internal handlers or services.
- OpenAPI remains the language-neutral public contract. Hono inference is a
  TypeScript convenience and cannot be required by external consumers.
- Large APIs are composed from small typed sub-applications to limit TypeScript
  inference cost and keep source files under the repository line limit.

## Alternatives Considered

### Plain Hono with Separate OpenAPI Files

This avoids an integration dependency but duplicates schemas and makes runtime
validation, inferred clients, and published documentation easier to drift.

### Decorator-Based Controller Framework

Controller frameworks can generate documentation, but their runtime and metadata
models are less natural for Workers and add abstractions the platform does not
need.

### OpenAPI-First Code Generation for Server Routes

OpenAPI-first generation is attractive for external SDKs, but generated server
layers complicate domain composition and local type inference. Generated clients
remain part of the planned public SDK workflow.

### Hono OpenAPI Middleware with Standard Schema

The broader Standard Schema approach supports more validators. Zod OpenAPI was
selected initially because the spike proves its route inference and named schema
generation directly. This decision can be revisited if the package stalls or
cannot express a required OpenAPI construct.

## Security Impact

Runtime validation occurs at the HTTP boundary. Explicit response contracts make
accidental data exposure visible in review and generated documentation. Schemas
do not replace authorization, output projection, or protocol conformance tests.

## Privacy and Residency Impact

Contracts identify where personal data crosses API boundaries and enable review
of exported fields. The tooling runs locally and does not send fixtures or
generated documents to a hosted service.

## Portability and Self-Hosting Impact

The contract application uses Web-standard request and response objects. Thin
entry points adapt it to Workers or Node without changing route behaviour, and
no provider binding appears in the route definition.

## Operational Impact

OpenAPI documents, inferred types, and runtime validation change together.
Contract checks must run for both supported server runtimes. Public SDKs are
released from versioned OpenAPI rather than importing monorepo source types.

## Consequences

- Zod schemas become a compatibility-sensitive part of the HTTP layer.
- Hono and its OpenAPI integration must be upgraded and tested together.
- Typed client bodies can be unions across documented response statuses and must
  be narrowed by status.
- The current Cloudflare declarations conflict with TypeScript 7 library types.
  Only the Workers spike tsconfig uses `skipLibCheck`; first-party files remain
  strict, runtime tests still execute in Workerd, and the exception is temporary.

## Validation

The retained spike proves:

1. a Zod path schema rejects invalid input;
2. OpenAPI 3.1 includes the path, operation identifier, parameters, response
   statuses, and named response component;
3. the inferred client is callable and returns a status-narrowed body type;
4. the route works through a real Node HTTP server; and
5. the same module executes inside the Workers Vitest integration.

Run:

```text
pnpm --filter @expressthat-auth/hono-contract-spike build
pnpm --filter @expressthat-auth/hono-contract-spike test:coverage
```

## Review Triggers

- A required OpenAPI 3.1 feature cannot be represented accurately.
- Hono inference materially degrades typecheck performance.
- Node and Workers route behaviour diverges.
- A maintained Standard Schema integration offers stronger compatibility.
- Cloudflare declaration files support TypeScript 7 without the scoped
  `skipLibCheck` exception.

## References

- [Hono Zod OpenAPI example](https://hono.dev/examples/zod-openapi)
- [Hono Node adapter](https://hono.dev/docs/getting-started/nodejs)
- [Cloudflare Workers Vitest integration](https://developers.cloudflare.com/workers/testing/vitest-integration/)
- [Cloudflare first Workers test](https://developers.cloudflare.com/workers/testing/vitest-integration/write-your-first-test/)
