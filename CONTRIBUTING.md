# Contributing to ExpressThat Auth

ExpressThat Auth is a security-sensitive TypeScript monorepo. Contributions are
welcome, but a feature is complete only when its implementation, tests,
documentation, security evidence, and both permanent runtime targets agree.

The repository currently advances through task-sized commits on `main`, not pull
requests. Each commit must therefore be independently reviewable and leave the
repository green.

## 1. Prepare the repository

Install:

- Git;
- Node.js `>=24.18.0 <27`;
- pnpm `11.16.0`, normally through Corepack; and
- Docker when working on deployment behavior or local shared dependencies.

Then run:

```bash
corepack enable
corepack prepare pnpm@11.16.0 --activate
pnpm install --frozen-lockfile
pnpm check
pnpm typecheck
pnpm test
pnpm build
```

The pinned package manager and lockfile are authoritative. Do not change a
dependency range, lockfile entry, runtime version, or tool version incidentally.
Ordinary local development uses SQLite directly. Start the pinned,
loopback-only queue, object storage, cache, email capture, and telemetry
services with `pnpm dev:dependencies`; PostgreSQL is not required for the normal
local path. The [local stack guide](deploy/docker/README.md) documents endpoints,
reset behavior, and host/container application configuration.

Never use production credentials, customer data, or personal data for
development or tests. Use the deterministic fixtures and synthetic secrets from
`@expressthat-auth/test-config`.

## 2. Select and understand a task

Use the first unchecked, dependency-ready item in
[`IMPLEMENTATION_TASKS.md`](IMPLEMENTATION_TASKS.md), unless a maintainer has
selected another task. Before writing code:

1. Read the task, dependencies, and milestone gate.
2. Read the relevant binding decisions in [`docs/decisions`](docs/decisions).
3. Identify the owning workspace in the
   [workspace ownership register](docs/architecture/workspace-ownership.md).
4. Read the affected package README and public contracts.
5. Identify whether behavior differs between Docker replicas, hosted and
   self-hosted operation, database dialects, or tenant environments.
6. Identify documentation that must change with the implementation.

Do not silently reinterpret a binding decision. Add or supersede an ADR when a
decision changes architecture, trust, portability, compatibility, or an
operator-visible contract.

## 3. Respect architecture boundaries

The permitted dependency direction is:

```text
apps and deploy
      |
      v
implementations and UI
      |
      v
domain, contracts, authorization, data-access, runtime, and config
```

Core behavior is runtime-neutral TypeScript. Applications compose packages;
packages never import applications. Product packages depend on capability and
repository contracts, not provider SDKs or deployment workspaces. Docker with
Node.js is the sole supported deployment target.

Run `pnpm check:runtime-neutrality` when changing core packages. The gate rejects
deployment-specific production imports and independently compiles every neutral
workspace through the dedicated Turborepo task graph.

Cross-request authority or coordination never lives only in process memory.
Sessions, keys, replay state, idempotency, rate limits, jobs, locks, cache state,
and authorization inputs require a shared durable implementation. Database,
queue, object storage, cache, email, secrets, keys, telemetry, and other
infrastructure remain adapter-based.

Use the repository generator for new workspaces and Hono routes. Its
[command reference](tooling/generators/README.md) documents the accepted kinds,
arguments, validation, and generated files.

Generated scaffolds include a package README, tests, strict configuration, and
the required public boundary. Handwritten files must preserve the same shape.

## 4. Program defensively

Treat every boundary value as `unknown` until it is runtime-validated. Enforce
transport size, structural depth/count, syntax, semantic, ownership, freshness,
purpose, and authorization constraints before performing work.

For every behavior, consider:

- authentication and authorization bypass;
- tenant, environment, application, and trust-plane confusion;
- enumeration and information leakage;
- injection, canonicalization, parser ambiguity, and resource exhaustion;
- replay, concurrency, ordering, idempotency, and partial failure;
- unsafe redirects, browser state, cookies, CORS, and caching;
- provider failure, timeouts, retries, duplicate delivery, and compensation;
- logs, traces, audits, events, exports, errors, and secret redaction; and
- data minimization, retention, residency, export, correction, and erasure.

Fail closed when identity, scope, policy, capability, or state is missing or
ambiguous. Derive tenant and environment context only through trusted paths
defined by the architecture. Never add a default administrator password,
reusable bootstrap credential, vendor master key, hidden support login, or
production bypass.

Use the [threat model](docs/security/threat-model.md),
[data-classification standard](docs/security/data-classification.md), and
[adversarial toolkit](docs/security/adversarial-testing-toolkit.md) while the
behavior is designed—not after it is complete. Report suspected vulnerabilities
through [`SECURITY.md`](SECURITY.md), never a public issue or change fragment.

## 5. Test while implementing

Every executable behavior needs tests that fail when it is removed or broken.
First-party executable TypeScript maintains 100% statement, branch, function,
and line coverage per file. Coverage is an execution floor, not evidence that
security invariants are complete.

As applicable, add:

- unit and component tests for success, denial, invalid input, and failure;
- compile-time contract tests for exported TypeScript APIs;
- at least two tenants and multiple environments for scoped behavior;
- hostile corpus, exact boundary, property, replay, concurrency, and redaction
  tests;
- repository and database conformance tests;
- Docker replica and reverse-proxy differential tests;
- browser accessibility and end-to-end journeys; and
- a named regression test for every bug or discovered security weakness.

Tests must be deterministic, bounded, isolated, and safe to run concurrently.
Skipped, focused, quarantined, flaky, order-dependent, or retry-masked tests are
not accepted.

Run the narrowest owning-workspace checks frequently:

```bash
pnpm --filter @expressthat-auth/example typecheck
pnpm --filter @expressthat-auth/example test
pnpm --filter @expressthat-auth/example test:coverage
```

Before committing, run every applicable repository gate described in section 8.

## 6. Keep code readable

First-party source, tests, configuration, migrations, and tooling files may not
exceed 250 physical lines. Documentation, generated files and migrations,
third-party code, lockfiles, and centrally approved machine-generated fixtures
are exempt. The automated line policy is authoritative.

Split by responsibility before reaching the limit. Do not compress logic,
remove useful names, or combine unrelated tests merely to reduce line count.

TypeScript is strict. Avoid `any`, non-null assertions, unsafe type assertions,
raw environment access, floating promises, console logging, embedded secrets,
and unvalidated JSON decoding. Biome and the repository policy plugins enforce
these rules.

## 7. Document as you build

Documentation is part of the implementation, not a follow-up. Update it in the
same task and commit as the behavior it describes.

The [documentation-as-code standard](docs/contributing/documentation-standard.md)
defines required workspace READMEs, links, examples, generation drift, version
markers, public/internal separation, ownership, and the automated gate.

Every task evaluates these audiences:

- developers: package README, architecture, contracts, examples, migrations;
- administrators: configuration, permissions, provider and operational impact;
- end users: flows, consent, account, privacy, and accessibility behavior;
- security/privacy reviewers: threats, controls, data handling, and evidence;
- operators: Docker setup, upgrades, backup, recovery, and diagnostics;
- support: safe troubleshooting and escalation boundaries.

Document exact commands and safe examples. Clearly distinguish implemented
behavior from plans, hosted commitments from self-hosted operator
responsibilities, and public artifacts from internal controls. Never document a
secret, live endpoint credential, embargoed weakness, or unsafe production
default.

Externally observable and release-relevant tasks add a completed fragment under
`.changes/`; internal tasks either add an `internal` fragment or explain why
none exists. Follow the [release process](docs/releases/release-process.md).

## 8. Review and commit

Complete the
[task review checklist](docs/contributing/task-review-checklist.md) before every
commit. At minimum, the full local gate for executable changes is:

```bash
pnpm format:check
pnpm check
pnpm check:documentation
pnpm lint
pnpm typecheck
pnpm test:types
pnpm test
pnpm test:coverage
pnpm build
pnpm scan:artifacts
pnpm scan:licenses
pnpm scan:dependencies
git diff --check
```

Also run contract, database, browser, deployment, generation-drift, container,
and runtime-parity checks whenever the affected task touches those surfaces.
The clean CI graph remains the final authority.

Review the complete diff for unrelated edits, unsafe generated content,
accidental credentials, missing docs, compatibility changes, and hosted claims
that incorrectly apply to self-hosted deployments. Record completion evidence
under the task in `IMPLEMENTATION_TASKS.md`.

Commit one coherent, completed task at a time:

```text
<type>(<area>): <summary> [TASK-ID]
```

Do not mark a task complete because code merely compiles. Its acceptance
condition, tests, documentation, security review, runtime implications, change
fragment, and applicable gates must all be complete.
