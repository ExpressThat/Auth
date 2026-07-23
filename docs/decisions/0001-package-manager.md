# ADR-0001: Use pnpm for Workspace and Dependency Management

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Platform engineering
- **Related tasks:** DEC-002, FND-001
- **Supersedes:** None
- **Superseded by:** None

## Context

The repository needs deterministic installs, workspace linking, a committed
lockfile, strict dependency declarations, and efficient operation across a
large Turborepo. The package manager must support Windows development, Linux
containers, and ordinary CI runners without changing application architecture.

## Decision

Use pnpm 11.16.0 for the initial repository.

- Pin `pnpm@11.16.0` in the root `packageManager` field.
- Declare the supported pnpm version in `engines.pnpm`.
- Define workspace packages in `pnpm-workspace.yaml`.
- Commit the single root `pnpm-lock.yaml`.
- Use the `workspace:` protocol for first-party package dependencies.
- Use pnpm catalogs for centrally coordinated third-party versions where they
  reduce drift across multiple workspaces.
- Run `pnpm install --frozen-lockfile` in CI and production builds.
- Treat an unexpected lockfile change as a reviewable dependency change.
- Keep install scripts disabled or explicitly approved where package support
  permits; never allow an unreviewed dependency to gain install-time execution.

The initial workspace globs cover:

```text
apps/*
packages/*
packages/providers/*
tooling/*
tooling/quality/*
tooling/generators/*
deploy/*
```

Declarative deployment directories that do not contain a package manifest are
harmless matches and do not become packages.

## Alternatives Considered

### npm Workspaces

npm is universally available with Node.js and would reduce tool bootstrapping.
It was not selected because pnpm provides stricter dependency isolation,
efficient content-addressed storage, and workspace features suited to the
planned package graph.

### Yarn

Yarn supports mature workspace workflows. It was not selected because pnpm is
already available in the development environment and meets the requirements
without introducing Plug'n'Play compatibility decisions.

## Security Impact

The lockfile is security-sensitive and must be reviewed with manifest changes.
Frozen installs prevent CI from silently resolving a different graph. Strict
workspace dependency declarations reduce accidental reliance on undeclared
packages. Install-time scripts remain a supply-chain risk and require explicit
approval.

## Privacy and Residency Impact

Package installation does not process customer data. CI cache and registry
configuration must not contain production secrets or personal data.

## Portability and Self-Hosting Impact

pnpm affects build and contributor workflows only. Published artifacts and
container runtime images must not require pnpm unless they intentionally expose
operator tooling. Self-hosted operators receive built artifacts or reproducible
pnpm-based source builds.

## Operational Impact

CI caches the pnpm content store using the lockfile as an input. Docker builds
use the pruned workspace lockfile produced for the selected deployment target.
Package-manager upgrades are explicit dependency changes with a clean-install
validation.

## Consequences

- Contributors use one package manager and one root lockfile.
- Workspace dependency mistakes fail early.
- The repository depends on pnpm tooling for development and source builds.
- FND-001 must add the pins and workspace file described here.

## Validation

- Install from a clean checkout with `pnpm install --frozen-lockfile`.
- Run the full Turborepo task graph after package-manager upgrades.
- Build pruned Docker and filtered Workers workspaces before accepting upgrades.

## Review Triggers

- pnpm 11 enters end of support.
- A required deployment or development environment cannot run pnpm.
- A material supply-chain feature requires a newer package-manager release.
- Workspace or pruning behaviour blocks a supported build profile.

## References

- [pnpm package manifest settings](https://pnpm.io/package_json)
- [pnpm workspace settings](https://pnpm.io/settings)
