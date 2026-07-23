# Architecture Decision Records

Architecture Decision Records (ADRs) capture choices that materially affect the
platform's security, portability, operability, or public contracts.

## Status Values

- **Proposed** — under evaluation and not yet binding.
- **Accepted** — the current implementation direction.
- **Superseded** — replaced by a later ADR.
- **Rejected** — considered but deliberately not selected.

## Index

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-package-manager.md) | Use pnpm for workspace and dependency management | Accepted |
| [0002](0002-supported-runtimes.md) | Support Node LTS, Workers, and modern browsers | Accepted |
| [0003](0003-test-toolchain.md) | Use Vitest and Playwright across test layers | Accepted |
| [Template](TEMPLATE.md) | Standard ADR structure | Reference |

## Numbering

Use four-digit, monotonically increasing identifiers:

```text
0001-short-decision-name.md
0002-next-decision.md
```

Never reuse the identifier of a deleted or superseded decision. Add new ADRs to
the index in numeric order and link superseding records in both directions.

## Lifecycle

1. Copy the template and record the context before implementation.
2. Compare realistic alternatives, including operational consequences.
3. Record security, privacy, residency, and self-hosting effects.
4. Mark the decision accepted before dependent backlog tasks are completed.
5. Revisit the ADR when a listed review trigger occurs.
