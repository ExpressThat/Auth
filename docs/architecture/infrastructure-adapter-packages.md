# Infrastructure Adapter Package Contract

## Purpose

Selectable infrastructure implementations are independently versioned,
reviewed, tested, and deployed packages. This prevents a queue implementation
from silently acquiring cache, secret, key, storage, observability, DNS,
certificate, or deployment authority and gives operators an auditable runtime
compatibility declaration before composition.

This contract applies equally to hosted and self-hosted Docker compositions.
It does not turn a self-hosted deployment into an ExpressThat-operated service
or create availability, residency, security-operation, or compliance promises
for operator-selected infrastructure.

## Location and Identity

Every selectable first-party infrastructure adapter is a direct workspace:

```text
packages/providers/<category>-<implementation>/
```

Its package name must exactly match the directory:

```text
@expressthat-auth/<category>-<implementation>
```

The reserved categories are:

| Category | Responsibility |
| --- | --- |
| `queue` | Durable publication, leasing, retry, and dead-letter behavior |
| `cache` | Distributed cache and atomic rate-limit state |
| `object-storage` | Durable object bodies, integrity, and signed access |
| `secret` | Secret material, versions, references, and rotation metadata |
| `key-management` | Key custody, wrapping, signing, and encryption operations |
| `observability` | Structured logs, metrics, traces, and correlated redaction |
| `dns` | Managed record publication and verification |
| `certificate` | Certificate issuance, renewal, attachment, and revocation |
| `deployment` | Managed frontend and domain deployment automation |

A package declares exactly one category. An implementation serving two
categories requires two packages even when they share a vendor SDK or private
utility package. Customer or application APIs cannot install or replace these
operator-owned adapters.

## Required Manifest

The package manifest includes a statically readable declaration:

```json
{
  "name": "@expressthat-auth/queue-reference",
  "exports": {
    ".": "./src/index.ts",
    "./manifest": "./src/manifest.ts"
  },
  "dependencies": {
    "@expressthat-auth/runtime": "workspace:*"
  },
  "expressthatAuth": {
    "infrastructureAdapter": {
      "category": "queue",
      "runtimeSupport": {
        "node": {
          "minimumMajor": 24,
          "maximumMajorExclusive": 27
        },
        "operatingSystems": ["linux"],
        "containerArchitectures": ["amd64", "arm64"],
        "externalCapabilities": ["network/tls"]
      }
    }
  }
}
```

The root export is the supported adapter API. `./manifest` is the explicit,
side-effect-free discovery surface used by composition and registry tooling.
Consumers cannot import private source files. The runtime contract must be a
production dependency rather than a development or peer dependency.

Runtime support lists are non-empty where an execution target is required,
contain no duplicates, and use only recognized operating systems and Docker
architectures. External capabilities use bounded namespaced identifiers and
may be empty. They describe requirements such as network access, persistent
storage, or a local socket without embedding credentials or endpoints.

The package declaration complements the validated runtime capability manifest.
Package metadata supports safe discovery without executing provider code;
startup validation still checks the selected adapter version, capability,
configuration and secret schema, profile, state semantics, health behavior,
residency, and current Node runtime.

## Enforcement

`pnpm check:boundaries` rejects:

- a reserved adapter directory without infrastructure metadata;
- infrastructure metadata outside a direct `packages/providers/*` workspace;
- a package name, directory, and category-prefix mismatch;
- missing root or `./manifest` exports;
- a missing or incorrectly scoped runtime-contract dependency;
- an empty Node major range; and
- duplicate operating-system, architecture, or external-capability entries.

The manifest schema also rejects unknown categories, unsupported target names,
empty target lists, unbounded or non-namespaced external capabilities, and
unknown metadata fields.

The rule is in the full and affected CI boundary gates. Future scaffolding and
operator registries consume this same contract rather than maintaining a
second provider list.

## Testing and Local Development

Contract-only deterministic doubles under `@expressthat-auth/runtime/testing`
are not selectable infrastructure packages. They are restricted to the test
deployment profile and may share explicit in-memory backends to simulate
replicas deterministically.

Local-development adapters that serve real application requests are selectable
and must follow this package contract. Stateful local adapters must use the
declared Compose resources and cannot claim hosted or production support until
their conformance, Docker, multi-instance, security, and residency evidence
passes.

## Adding an Adapter

1. Create one direct provider workspace using the reserved category prefix.
2. Declare complete runtime support and required external capabilities.
3. Export only intentional public surfaces, including `.` and `./manifest`.
4. Depend on the runtime contracts and implement the matching narrow port.
5. Pass the category conformance suite, type tests, redaction tests, Docker
   targets, and every claimed runtime target.
6. Document configuration, secret references, failure behavior, data paths,
   scaling limits, health, retry semantics, and operator responsibilities.
7. Add it to an operator-controlled registry only after all release evidence
   passes.
