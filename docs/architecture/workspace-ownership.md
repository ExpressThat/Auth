# Workspace Ownership and Boundaries

## Purpose

This register defines the initial Turborepo workspaces, their responsibilities,
and their permitted dependency direction. A workspace existing here does not
mean its production behavior is implemented.

## Applications

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `apps/auth-api` | Identity API | Authentication, OAuth/OIDC, sessions, consent, account, and end-user endpoints |
| `apps/management-api` | Management API | Customer organisation, application, user, policy, provider, and audit management |
| `apps/platform-api` | Platform operations | Restricted system-organisation, bootstrap, support, deployment, and operator endpoints |
| `apps/auth-web` | Identity experience | React sign-up, sign-in, consent, recovery, security, account, and organisation-switching UI |
| `apps/management-web` | Management experience | React customer and platform administration UI |
| `apps/jobs` | Durable execution | Outbox, notifications, webhooks, provisioning, privacy, cleanup, and scheduled work |

Applications compose packages. No package may import an application.

## Runtime-Neutral Packages

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `packages/domain` | Domain | Entities, value objects, policies, and use cases without infrastructure imports |
| `packages/api-contracts` | API contracts | Boundary schemas, errors, events, route contracts, and OpenAPI source definitions |
| `packages/auth-protocols` | Protocols | OAuth, OpenID Connect, tokens, grants, discovery, and protocol conformance |
| `packages/authorization` | Authorization | Permissions, roles, grants, conditions, and policy evaluation |
| `packages/data-access` | Persistence contracts | Database-neutral repositories, units of work, and transaction semantics |
| `packages/runtime` | Runtime contracts | Clock, randomness, crypto, queue, cache, object, secret, key, telemetry, and provider ports |
| `packages/config` | Configuration | Runtime-validated configuration and capability-policy schemas |
| `packages/sdk-core` | Developer experience | Shared and generated API client foundations |

Runtime-neutral packages cannot import deployment workspaces, runtime-specific
entry points, database implementations, or provider implementations.

## Implementation and Conformance Packages

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `packages/database-sqlite` | Data platform | Drizzle SQLite schema, migrations, and repository adapters |
| `packages/database-postgres` | Data platform | Drizzle PostgreSQL schema, migrations, and repository adapters |
| `packages/database-conformance` | Data quality | Shared repository, transaction, migration, and dialect parity suites |
| `packages/ui` | Design system | Shared HeroUI components and design tokens; never server repositories or secrets |
| `packages/providers/*` | Integrations | Independently packaged provider and infrastructure adapter implementations |

Implementations depend on runtime-neutral contracts. Conformance packages may
depend on contracts and implementations only to test them.

## Shared Configuration

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `packages/typescript-config` | Engineering productivity | Strict base, library, Node, React, and tooling TypeScript profiles |
| `packages/lint-config` | Code quality | Custom repository lint-policy support beyond the root Biome configuration |
| `packages/test-config` | Test engineering | Shared Vitest, component, coverage, fixture, and test utilities |
| `packages/config` | Runtime platform | Classified, runtime-validated startup configuration contracts and safe failure reporting |

Configuration packages cannot import product code.

## Deployment Workspaces

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `deploy/docker` | Container platform | Container entry points, local dependency Compose, production Dockerfiles, and self-hosted composition |

Deployments select adapters and compose applications. Product packages never
import deployment workspaces. Hosted and self-hosted Docker compositions expose
the same contracts and security behavior; hosted operational commitments do not
transfer to self-hosted deployments.

The local dependency Compose stack and production self-hosted example are
separate profiles. Local dependencies default to loopback-only development
settings and cannot be promoted as a production topology.

## Tooling Workspaces

| Workspace | Ownership | Responsibility |
| --- | --- | --- |
| `tooling/generators` | Engineering productivity | Safe generators for workspaces, routes, contracts, and migrations |
| `tooling/scripts` | Engineering productivity | Repository-wide TypeScript automation |
| `tooling/quality` | Code quality and security | Coverage, file-size, dependency-boundary, and repository-policy enforcement |
| `tooling/*-spike` | Architecture | Temporary executable compatibility evidence; removed after absorption |

Tooling may inspect product workspaces but cannot become a production runtime
dependency. A temporary spike is not a supported application or package.

## Dependency Direction

```text
apps and deploy
      |
      v
implementations and UI
      |
      v
domain, contracts, authorization, data-access, runtime, and config

conformance packages -> contracts + implementations under test
tooling             -> repository inspection only
shared config       -> imports no product code
```

Cyclic workspace dependencies and undeclared deep imports are prohibited. Each
package will expose an explicit public API when implementation begins.
