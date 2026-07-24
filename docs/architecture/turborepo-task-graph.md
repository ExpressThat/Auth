# Turborepo Task Graph

## Purpose

The root `turbo.json` is the authoritative task graph for all workspaces. Tasks
may exist in the graph before a workspace implements the matching script; Turbo
applies a task only where that script exists.

All tasks use Turbo's conservative default package inputs. Root Biome, package,
lockfile, workspace, TypeScript, and Turbo configuration are global inputs, so
changes to shared engineering policy invalidate affected cache entries.

## Task Families

| Family | Tasks | Cache and dependency rule |
| --- | --- | --- |
| Build | `generate`, `build` | Deterministic generation and build artifacts are cached; dependency workspaces complete first. |
| Quality | `lint`, `typecheck`, `test:types` | Generated source and dependency workspaces are ready before checks run. |
| Tests | `test`, `test:coverage`, `test:e2e` | Unit and coverage work is cached; browser journeys are uncached and retain bounded diagnostics. |
| Contracts and SDKs | `generate:contracts`, `check:contracts`, `generate:sdk` | Public contracts precede compatibility checks and SDK generation; generated artifacts are declared outputs. |
| Database | `db:generate`, `db:check`, `db:migrate`, `db:reset` | Generation and drift checks are cacheable; database mutation is never cached and reset is interactive. |
| Development | `dev`, `dev:dependencies` | Long-running tasks are persistent, uncached, and restartable under `turbo watch`. |
| Deployment | `package:deployment`, `check:deployment`, `test:deployment`, `deploy` | Packaging is deterministic; black-box tests and external deployment are never cached. |

## Environment and Secrets

Cacheable tasks declare only non-secret build inputs such as `NODE_ENV` and
public `VITE_*` values. Database credentials, deployment tokens, and local
service endpoints are passed through only to uncached stateful tasks. They do
not become cached artifacts or cache-key inputs.

Frontends must continue to treat all `VITE_*` values as public because Vite
embeds them in browser artifacts.

## Outputs

The graph declares only task-owned artifacts:

- `dist` for builds;
- `generated`, `openapi`, and generated SDK source for generators;
- migrations and generated database source for database generation;
- coverage, Playwright reports, and browser test results for tests;
- `artifacts` and `dist` for deployment packaging.

Tasks that produce only logs omit `outputs`. Stateful tasks remain uncached even
when they retain local diagnostics.

## Validation

Use:

```text
pnpm exec turbo run build lint typecheck test test:coverage test:types test:e2e --dry=json
```

The quality package also validates required task families, artifacts, persistent
flags, stateful cache rules, and secret pass-through behavior. Later CI tasks
select affected portions of this same graph rather than defining a second graph.
