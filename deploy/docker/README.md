# Docker Deployment

Owns Docker composition, local shared dependencies, production packaging,
health checks, and deployment conformance. The production application images
and self-hosted composition remain planned; the local dependency stack is
implemented and tested.

## Operator-controlled adapter selection

`resolveDockerAdapterConfiguration` is the common hosted and self-hosted
selection boundary. It strictly parses startup-only operator input, resolves
configured namespaced adapter identifiers from the registry compiled into the
Docker artifact, and cross-checks the package declaration, runtime manifest,
operating system, container architecture, available external capabilities,
capability policy, profile, Node runtime, shared state, and residency before an
application listener can start.

The registry does not dynamically load packages and an unavailable identifier
fails startup. Adapter configuration is not an HTTP resource, does not appear
in application OpenAPI contracts, and cannot be supplied by a customer or
application administrator. Repository boundaries prohibit API applications and
ordinary product packages from importing the operator parser or registry.

Hosted deployment configuration is controlled by ExpressThat operations.
Self-hosted operators control their own selection and are responsible for the
compatibility, security, infrastructure, region, availability, backups,
recovery, and compliance consequences of those choices.

## Local shared dependencies

From the repository root:

```bash
pnpm dev:dependencies
```

The command validates the checked-in policy, validates the Compose model, starts
the services in the background, and waits for every health check. It accepts
only the local lifecycle commands and refuses to run when `NODE_ENV`, `APP_ENV`,
`DEPLOYMENT_ENV`, or `EXPRESSTHAT_ENV` is `prod` or `production`.

Use the focused commands when managing the stack:

```bash
pnpm --filter @expressthat-auth/deploy-docker local:validate
pnpm --filter @expressthat-auth/deploy-docker local:status
pnpm --filter @expressthat-auth/deploy-docker local:reset
pnpm --filter @expressthat-auth/deploy-docker local:down
```

`local:reset` removes all four named data volumes before recreating the stack.
That deliberately deletes local broker, object, cache, and captured-email data.
Use `local:down` when data should survive the next start.

## Services and endpoints

All published ports bind explicitly to `127.0.0.1`. Containers on the Compose
network use the service endpoint. The two checked-in environment examples expose
the same application configuration keys for both execution modes.

| Capability | Service | Host-run endpoint | Container-run endpoint |
| --- | --- | --- | --- |
| Durable queue | RabbitMQ | `amqp://127.0.0.1:5672/expressthat` | `amqp://rabbitmq:5672/expressthat` |
| Queue management | RabbitMQ | `http://127.0.0.1:15672` | Not an application dependency |
| S3-compatible objects | SeaweedFS | `http://127.0.0.1:8333` | `http://object-storage:8333` |
| Cache/rate-limit state | Valkey | `redis://127.0.0.1:6379/0` | `redis://valkey:6379/0` |
| SMTP | Mailpit | `127.0.0.1:1025` | `mailpit:1025` |
| Captured-email UI | Mailpit | `http://127.0.0.1:8025` | Not an application dependency |
| OTLP/gRPC | OpenTelemetry Collector | `http://127.0.0.1:4317` | `http://otel-collector:4317` |
| OTLP/HTTP | OpenTelemetry Collector | `http://127.0.0.1:4318` | `http://otel-collector:4318` |
| Collector health | OpenTelemetry Collector | `http://127.0.0.1:13133` | `http://otel-collector:13133` |

Copy values from
[`config/applications.host.local.env.example`](config/applications.host.local.env.example)
for an application running on the host, or from
[`config/applications.container.local.env.example`](config/applications.container.local.env.example)
for one attached to the Compose network. These contain conspicuously local-only
credentials, not secrets suitable for any shared or production environment.

SQLite runs directly in each local application and is intentionally absent from
Compose. PostgreSQL is not required for ordinary development.

## Reproducibility and safety

- Every image uses an exact release tag and immutable multi-architecture
  manifest digest.
- Every service has a health check and persistent state has a named volume.
- No service publishes on a non-loopback address.
- The policy rejects missing services, floating images, public ports, missing
  health checks, privileged containers, host networking, or a missing local
  acknowledgement before Docker executes.
- The Compose file requires `local.compose.env`, and the supported command fixes
  the project name to `expressthat-auth-local`.
- The stack is development infrastructure only. It has known local credentials,
  no TLS, no availability promise, no backups, and no production hardening.
- Never place customer, production, or personal data in it.

Image versions are reviewed as dependency changes. The selected images are:
RabbitMQ 4.3.1, SeaweedFS 4.29, Valkey 8.1.8, Mailpit 1.30.0, and OpenTelemetry
Collector Contrib 0.156.0.

## Hosted and self-hosted boundary

Self-hosted operators choose their infrastructure, region, security, capacity,
availability, backup, recovery, and compliance posture. Hosted service
commitments do not apply to self-hosted deployments. See the
[responsibility boundary](../../docs/operations/hosted-self-hosted-responsibility.md).
