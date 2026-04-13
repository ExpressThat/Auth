# ExpressThat Auth

ExpressThat Auth is being built as a full authentication platform for multi-tenant and multi-layer tenant products.

The long-term goal is to provide a complete identity and access system that supports:

- Multi-tenancy
- Nested tenant boundaries
- Organizations and organizational membership
- Enterprise authentication
- MFA
- Application-level access control
- User and workspace management
- Internal platform administration

## What This Is

ExpressThat Auth is intended to become a multi-multi-tenant application.

At the very top level, the platform has the concept of a workspace for internal administration.

Think of top-level workspaces as organizations for the platform itself.

Each top-level workspace can then contain its own users, organizations, and apps that are used to authenticate users for downstream products.

## Top-Level Workspace Model

The first workspace that exists is reserved for internal platform administration.

This first workspace:

- Cannot be deleted
- Represents the internal admin workspace for ExpressThat Auth
- Contains the default app used to configure how users authenticate against the platform's internal admin surface in the web application

This gives the platform a built-in control plane tenant from the very beginning.

## Single-Tenant Mode

In single-tenant mode, such as when someone pulls this repository and self-hosts it, that default top-level workspace can be the only top-level workspace in the system.

In that model, the platform is operating with a single top-level workspace for one deployment, with the internal admin workspace acting as the root workspace.

## Multi-Workspace Mode

In multi-workspace mode, the default workspace still exists but is hidden from all users except the SuperUser.

That hidden default workspace is reserved for operating ExpressThat Auth itself.

Users can then create their own workspaces, and each workspace can have multiple users who manage it.

These workspaces should be thought of as customer organizations at the platform boundary.

This is not tied to whether the application is vendor-hosted or self-hosted. It is a configuration choice for how a deployment is intended to operate.

## Nested Tenant Model

Inside each workspace there is another layer of tenancy.

Each workspace can have its own:

- Users
- Organizations
- Apps

Those internal users and organizations can then be used by apps created inside that workspace to authenticate end users.

That is why this is a multi-multi-tenant system rather than a simple single-layer tenant model.

At a high level, the platform direction is:

`next-auth -> top-level workspace -> workspace users and organizations -> apps -> authenticated users`

## Planned Internal Control Plane Model

- A default internal workspace for ExpressThat Auth itself
- A default internal app for ExpressThat Auth itself
- Internal users and platform operations running through that internal workspace/app pairing

In multi-workspace mode, that internal workspace will remain hidden from normal users and visible only to the SuperUser.

That design allows the platform to manage itself through the same tenant model it offers to customers, without exposing its foundational control-plane tenant to customer administrators.

## Repository Structure

This repository is a Turborepo monorepo containing the platform applications and shared packages.

## Deployment Model

Each major platform component can be deployed as a separate entity.

This means the web application and the API do not need to be deployed as a single unit and can be scaled independently based on their workload.

That separation is intentional so the control plane experience, end-user experience, and backend auth flows can evolve and scale without being tightly coupled at deployment time.

### Apps

- `apps/web` - the shared web interface that includes both the internal admin/control-plane experience and end-user authentication flows
- `apps/api` - ASP.NET Core Web API (.NET 10); the full API source and entry-point for running and deploying

## Runtime Responsibilities

The two main applications have distinct responsibilities:

- The web application contains both the control-plane/admin experience and the user-facing authentication and app login flows
- The API is the shared backend used by the web application for administrative actions, user authentication, password resets, and other auth operations

This split allows each surface to be deployed and scaled separately while still operating as one platform.

### Packages

- `packages/api-client` - auto-generated TypeScript client for the API (openapi-typescript + openapi-fetch)
- `packages/database` - Prisma schema, generated client, and database access
- `packages/models` - shared domain models
- `packages/utils` - shared utilities
- `packages/eslint-config` - shared lint configuration
- `packages/typescript-config` - shared TypeScript configuration

## Development

Install dependencies:

```sh
pnpm install
```

Start the repo in development mode:

```sh
pnpm dev
```

Run type checking:

```sh
pnpm check-types
```

Run formatting and lint checks:

```sh
pnpm format-and-lint
```

Apply formatting fixes:

```sh
pnpm format-and-lint:fix
```

## Near-Term Roadmap

- Build the top-level workspace model for the internal admin/control-plane experience in the web app
- Build the nested tenant model inside each workspace
- Define how workspace users, organizations, apps, and authenticated users relate to each other
- Expand enterprise authentication support
- Add MFA flows and management
- Preserve the hidden internal workspace/app model for self-management in multi-workspace deployments
