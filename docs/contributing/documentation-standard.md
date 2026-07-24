# Documentation-as-Code Standard

Documentation is a build artifact owned by the same task and workspace as the
behavior it describes. A task is not complete when its code, contract,
configuration, operational effect, or user experience has changed but its
documentation still describes the previous state.

## Required documentation

Every workspace has a `README.md` beside its `package.json`. The README states
its purpose, implementation status, boundary, runtime or deployment impact, and
links to deeper authoritative material. API workspaces reference their OpenAPI
contract. Deployment workspaces explicitly distinguish hosted commitments from
self-hosted operator responsibilities.

Repository entry points remain present:

- `README.md` for product and repository orientation;
- `CONTRIBUTING.md` for the implementation workflow;
- `AUTH_SOLUTION_OVERVIEW.md` for intended architecture and capabilities;
- `IMPLEMENTATION_TASKS.md` for ordered delivery and evidence; and
- `SECURITY.md` for safe vulnerability reporting.

## Links and examples

All local Markdown links must resolve to a tracked or newly created file, or to
a directory containing `README.md`. Public documentation cannot link to an
internal documentation artifact.

Shell examples use fenced `bash`, `sh`, or `shell` blocks. Root `pnpm` commands
must reference an actual root script, package filter, installation command, or
approved scaffold command. Examples cannot pipe downloaded content to a shell,
disable TLS verification, contain destructive recursive deletion, or embed a
credential-like value. Commands that are practical to run in an isolated
checkout are exercised by the owning task or a focused repository test.

## Generated and versioned documentation

Generated Markdown uses a deterministic source and begins with:

```text
<!-- generated-from: path/to/source; sha256: <source-content-sha256> -->
```

The documentation gate recomputes the source hash and rejects drift, missing
sources, or missing markers. Generated outputs are changed by their generator,
not edited independently.

Immutable release, version, and Markdown OpenAPI artifacts include:

```text
<!-- documentation-version: <immutable-version> -->
```

Unreleased living documents instead state their implementation status in
prose. OpenAPI contracts remain the source for public HTTP reference material;
handwritten guides link to the relevant contract and explain behavior rather
than redefining schemas.

## Public and internal separation

Public documentation belongs under public release surfaces. Sensitive
operational material under `docs/internal/` begins with:

```text
<!-- visibility: internal -->
```

Public documents never link to internal documents. Neither surface contains
credentials, customer data, personal data, embargoed vulnerability details, or
controls whose disclosure would create an avoidable bypass.

## Ownership and failures

The automated gate reports both the source path and owning workspace or
documentation area. The owner fixes the source documentation, generator, or
reference in the same task. Suppressing a broken link, stale generated output,
missing README, unsafe example, or responsibility-boundary failure is not an
accepted completion path.

Run:

```bash
pnpm check:documentation
```

The root `pnpm check` and both repository CI paths run this gate. The
[contributor guide](../../CONTRIBUTING.md) and
[task review checklist](task-review-checklist.md) define the human review that
complements these automatable checks.
