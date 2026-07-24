# API Contracts

Status: planned package shell.

Owns boundary schemas, errors, events, route contracts, and OpenAPI 3.1 source
definitions shared by APIs, documentation, and generated clients. Runtime
validation and public TypeScript types must derive from the same contract.

The package is runtime-neutral and imports no application, database, provider,
or deployment implementation. See
[ADR-0004](../../docs/decisions/0004-hono-contracts.md).
