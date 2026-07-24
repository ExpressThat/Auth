# Repository Quality

Status: active engineering tooling.

Owns executable repository policy for coverage participation, file size,
workspace boundaries, licences, generated artifacts, documentation, and CI
configuration.

Each rule has focused tests for accepted and rejected inputs. Run:

```bash
pnpm --filter @expressthat-auth/quality test
pnpm --filter @expressthat-auth/quality test:coverage
pnpm --filter @expressthat-auth/quality check:documentation
```

See the [contributor guide](../../CONTRIBUTING.md).
