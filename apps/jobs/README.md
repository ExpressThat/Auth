# Jobs

Status: planned application shell.

Owns durable outbox, notification, webhook, provisioning, privacy, cleanup, and
scheduled work. Jobs use queue and scheduler contracts, tolerate redelivery,
remain idempotent, and store no authoritative coordination only in process.

Workers and Docker compositions must preserve the same job semantics. See the
[workspace register](../../docs/architecture/workspace-ownership.md).
