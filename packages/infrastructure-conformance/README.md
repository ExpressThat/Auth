# Infrastructure adapter conformance

`@expressthat-auth/infrastructure-conformance` provides the reusable behavioral
gate for infrastructure adapters. It is test tooling, not an application
runtime dependency.

## Capability suites

The public API defines suites for cache, queue, object storage, observability,
secret storage, key management, DNS automation, certificate automation, and
frontend deployment automation. Stateful capabilities require probes for:

- success and permanent failure;
- bounded execution and retry classification;
- concurrent use;
- diagnostic redaction;
- runtime support;
- dependency health; and
- residency or tenant-isolation behavior.

Secret-storage and key-management suites require the same evidence except
health because their current contracts do not expose a health operation.

Definitions fail closed when an axis is missing, duplicated, unexpected, or
malformed. Each case runs with an `AbortSignal` and a bounded timeout. Execution
errors are normalized into safe, serializable conformance diagnostics.

## Adapter use

An adapter package supplies capability-specific probes and runs the returned
suite in its test project. Probes must exercise the adapter's public contract;
they must not inspect implementation internals. Operator manifests and Docker
tests provide additional evidence for every runtime, operating system,
architecture, external capability, and residency policy the package claims.

The deterministic runtime adapters execute every applicable suite in this
package. Production adapters must reuse the same builders and assertions.
