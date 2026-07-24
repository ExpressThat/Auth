# Repository Scripts

Status: planned tooling shell.

Owns repository-wide TypeScript automation that is not a reusable product or
quality-policy package. Scripts must be deterministic where cacheable, validate
all inputs, avoid embedded credentials, and expose stable root commands.

Tooling never becomes a production runtime dependency. See the
[Turborepo task graph](../../docs/architecture/turborepo-task-graph.md).
