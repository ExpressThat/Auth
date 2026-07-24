---
task: FND-023
category: added
audiences: developers, operators
surfaces: local-development, docker, adapters
breaking: false
migration: none
security: loopback-only-digest-pinned-local-services
---

Added the Docker Compose local dependency stack for RabbitMQ, S3-compatible
object storage, Valkey, SMTP capture, and OpenTelemetry, including health checks,
immutable image digests, deterministic reset, production-mode refusal, and
matching host/container application configuration examples.
