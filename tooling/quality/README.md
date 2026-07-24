# Repository Quality

Status: active engineering tooling.

Owns executable repository policy for coverage participation, file size,
workspace boundaries, licences, generated artifacts, documentation, and CI
configuration.

Runtime-neutral production source rejects Node built-ins and runtime-specific
module protocols. A neutral workspace with source must provide a
`build:runtime-neutral` task, and `check:runtime-neutrality` runs those tasks
without selecting an application or deployment composition root.

Each rule has focused tests for accepted and rejected inputs. Run:

```bash
pnpm --filter @expressthat-auth/quality test
pnpm --filter @expressthat-auth/quality test:coverage
pnpm --filter @expressthat-auth/quality check:documentation
pnpm check:runtime-neutrality
```

See the [contributor guide](../../CONTRIBUTING.md).
