# Configuration

## Purpose and status

`@expressthat-auth/config` is the runtime-neutral startup configuration
boundary. RUN-001 is implemented. The package validates values supplied by a
Docker composition root but never reads environment variables, files, or
container secrets itself.

## Public exports

- `defineConfiguration` declares the schemas for public values, secret values,
  build-time values, and runtime capability bindings.
- `parseStartupConfiguration` validates an untrusted four-section envelope and
  returns `ValidatedConfiguration`.
- `StartupConfigurationError` exposes stable area, code, and path information
  without Zod messages or rejected values.
- Inference helpers expose each definition's public, secret, build, and binding
  types.

The separate `@expressthat-auth/config/operator` export parses infrastructure
adapter selection only at a Docker deployment composition root. It accepts a
strict list of namespaced capability-to-adapter bindings, one of the hosted,
self-hosted, or local-development profiles, and an exact Node runtime version.
The target operating system, Docker architecture, and available namespaced
external capabilities are explicit. It returns a validated, immutable,
redacting `OperatorAdapterSelection`.
Applications and product packages are forbidden from importing this subpath by
the repository boundary gate.

Definitions should use strict Zod object schemas. Public values may be returned
to a browser only when the owning API contract explicitly permits them. Secret
values and runtime bindings are available only through explicit typed
accessors. JSON serialization returns public/build values and configured key
names; it never returns secret or binding values.

## Startup example

```ts
import {
  defineConfiguration,
  parseStartupConfiguration,
} from "@expressthat-auth/config";
import { z } from "zod";

const definition = defineConfiguration({
  public: z.strictObject({ externalOrigin: z.url() }),
  secrets: z.strictObject({ cookieKey: z.string().min(32) }),
  build: z.strictObject({ release: z.string().min(1) }),
  bindings: z.strictObject({ clock: z.object({ now: z.function() }) }),
});

const configuration = parseStartupConfiguration(definition, untrustedInput);
configuration.secret("cookieKey");
configuration.binding("clock");
```

The composition root must catch `StartupConfigurationError`, record only its
safe representation, and stop before opening a listener. It must never log the
untrusted envelope.

Operator configuration is startup input, not a customer resource. It is absent
from public configuration values, provider-instance APIs, management routes,
OpenAPI contracts, and the ordinary package root. Duplicate capabilities,
unknown fields, malformed identifiers, test-profile selection, or invalid
runtime versions fail before adapter lookup.

## Security, privacy, and operations

Classification is deliberate: putting a credential in a public or build
schema is a security defect. Secrets remain write-only outside trusted
composition code. Bindings may contain live clients and are never serialized.
Invalid, missing, or additional envelope data fails startup with no partial
configuration.

Hosted operators own the configuration of the hosted service. Self-hosted
operators own their Docker secrets, bindings, infrastructure, regions,
availability, recovery, and compliance; this package makes no operational
guarantee.

## Development

```bash
pnpm --filter @expressthat-auth/config typecheck
pnpm --filter @expressthat-auth/config test
pnpm --filter @expressthat-auth/config test:coverage
pnpm --filter @expressthat-auth/config test:types
```
