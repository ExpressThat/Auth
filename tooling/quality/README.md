# Repository Quality

Status: active engineering tooling.

Owns executable repository policy for coverage participation, file size,
workspace boundaries, licences, generated artifacts, documentation, and CI
configuration.

Runtime-neutral production source rejects Node built-ins and runtime-specific
module protocols. A neutral workspace with source must provide a
`build:runtime-neutral` task, and `check:runtime-neutrality` runs those tasks
without selecting an application or deployment composition root.

Infrastructure adapter inspection reserves the queue, cache, object-storage,
secret, key-management, observability, DNS, certificate, and deployment
provider prefixes. Each selectable implementation must be a direct provider
workspace with validated package metadata, matching identity and category,
explicit root and manifest exports, a production runtime-contract dependency,
and unique Node, operating-system, Docker-architecture, and external-capability
support declarations.

Stateless-service inspection covers production API, job, domain,
authorization, and protocol source. It rejects mutable module state, persistent
service collections, sensitive in-process stores, and local cache/lock
packages. Request-scoped values and explicitly frozen metadata remain allowed.
The rule prevents common singleton mistakes; replica conformance remains
required to prove an injected backend is genuinely shared.

Each rule has focused tests for accepted and rejected inputs. Run:

```bash
pnpm --filter @expressthat-auth/quality test
pnpm --filter @expressthat-auth/quality test:coverage
pnpm --filter @expressthat-auth/quality check:documentation
pnpm check:runtime-neutrality
```

See the [contributor guide](../../CONTRIBUTING.md).
