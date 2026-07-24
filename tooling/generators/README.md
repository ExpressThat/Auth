# Repository Generators

This workspace owns deterministic scaffolding for TypeScript workspaces and
contract-first Hono routes. It writes only within the repository, validates
names and options, refuses accidental overwrites, and produces tests and
documentation with source.

## Public commands

Create a library, application, or provider workspace:

```text
pnpm scaffold workspace --kind library --name example --description "Example package."
pnpm scaffold workspace --kind application --name example-api --description "Example API."
pnpm scaffold workspace --kind provider --name email-example --description "Example adapter."
```

Create a documented GET route contract in an existing generated application:

```text
pnpm scaffold route --app example-api --name health
```

Names must be lowercase kebab-case. The generator rejects unknown options,
missing values, duplicate exports, existing destination files, missing files
that should be updated, and paths outside the repository.

## Generated workspaces

Each workspace includes:

- A canonical `@expressthat-auth/*` private package manifest.
- Public exports and the standard build, lint, test, coverage, and typecheck
  tasks.
- Strict shared TypeScript and Vitest configuration.
- Executable source with a corresponding unit test.
- A README covering purpose, boundaries, exports, runtimes, commands,
  extension points, security/privacy, and deeper documentation.

Applications live under `apps/`, libraries under `packages/`, and provider
implementations under `packages/providers/`.

## Generated routes

A route adds a Zod/OpenAPI Hono contract, unit test, package subpath export,
required exact-pinned dependencies, and a route guide covering access, tenant
scope, errors, limits, security, privacy, and operations. The generated
contract is intentionally minimal; its descriptive placeholders must be
completed as part of the feature task that invokes the generator.

## Development and tests

- `pnpm --filter @expressthat-auth/generators build`
- `pnpm --filter @expressthat-auth/generators test`
- `pnpm --filter @expressthat-auth/generators test:coverage`
- `pnpm --filter @expressthat-auth/generators typecheck`

Tests cover validation, deterministic templates, manifest mutation, safe path
resolution, overwrite protection, filesystem behavior, and CLI failures.

## Security and privacy

Generator inputs are untrusted and schema-validated. File plans are preflighted
before writes, never interpolate credentials, and cannot traverse outside the
selected repository root. Generated examples contain synthetic, non-personal
data. Generated documentation must preserve hosted and self-hosted
responsibility boundaries as the component evolves.

## Further documentation

- [Architecture overview](../../AUTH_SOLUTION_OVERVIEW.md)
- [Implementation backlog](../../IMPLEMENTATION_TASKS.md)
- [Workspace boundaries](../quality/src/boundary-policy.ts)
