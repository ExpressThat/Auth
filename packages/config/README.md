# Config

Status: planned package shell.

Owns runtime-validated configuration and capability-policy schemas. It
distinguishes public build values from secrets and validates adapter
capabilities before a service starts accepting traffic.

The package exposes contracts, not environment access or deployment-specific
bindings. See the [workspace register](../../docs/architecture/workspace-ownership.md).
