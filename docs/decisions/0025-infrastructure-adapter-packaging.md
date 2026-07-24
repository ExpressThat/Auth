# ADR-0025: Package Infrastructure Adapters by Capability

- **Status:** Accepted
- **Date:** 2026-07-24
- **Owners:** Runtime, security, platform, and operations engineering
- **Related tasks:** RUN-016 through RUN-021, OPS-007 through OPS-012
- **Supersedes:** None
- **Superseded by:** None

## Context

Queue, cache, object storage, secrets, key management, observability, DNS,
certificate, and deployment automation have different authority, state,
failure, scaling, runtime, data-transfer, and security properties. Combining
them in one provider package makes dependency review, runtime compatibility,
operator selection, conformance, and incident isolation ambiguous.

The repository also needs to discover adapter compatibility before executing
untrusted or incompatible provider code. TypeScript interfaces alone cannot
describe supported container targets or required external capabilities to
deployment tooling.

## Decision

Every selectable first-party infrastructure implementation is a direct
`packages/providers/<category>-<implementation>` workspace named
`@expressthat-auth/<category>-<implementation>`. Queue, cache, object-storage,
secret, key-management, observability, DNS, certificate, and deployment are
reserved singular categories. One package declares exactly one category.

Each package has explicit root and `./manifest` exports, depends on
`@expressthat-auth/runtime` in production dependencies, and includes validated,
statically readable package metadata declaring:

- its singular infrastructure category;
- a non-empty supported Node major-version range;
- supported operating systems;
- supported Docker architectures; and
- namespaced required external capabilities.

The static package declaration supports discovery and deployment validation.
The exported runtime capability manifest remains authoritative for adapter
identity, version, capability contract, configuration and secret schemas,
deployment profile, shared-state semantics, failure and health behavior, and
residency. Operator composition will cross-check both declarations before
startup.

Directory prefixes are reserved even before first-party implementations exist,
so an undeclared provider cannot bypass the contract. Deterministic doubles in
the runtime testing export are not selectable and remain test-profile-only.

## Alternatives Considered

### One Infrastructure Package per Vendor

Rejected. A vendor SDK may be shared privately, but granting one package several
unrelated platform capabilities creates excess authority and couples release,
failure, and migration boundaries.

### Encode Compatibility Only in TypeScript

Rejected. Deployment tooling must reject an incompatible package without
executing it, and package registries need a stable machine-readable discovery
surface.

### Dynamically Load Arbitrary Operator Modules

Deferred. It creates supply-chain, sandboxing, versioning, and support
boundaries that are not needed for the initial hosted or self-hosted release.
Later operator-installed adapters must use this same contract and cannot create
a parallel provider model.

## Security Impact

Singular capability packages reduce ambient authority and make dependency,
secret, network, native-code, and vulnerability review capability-specific.
Explicit exports block unsupported deep imports. Static metadata is
untrusted input and is schema validated; it contains no credentials, endpoints,
or secret material. Runtime composition still fails closed on mismatched,
unavailable, unsupported, or policy-incompatible bindings.

## Privacy and Residency Impact

Declared external capabilities expose expected data paths for residency and
subprocessor review. A declaration is not proof of residency: hosted adapters
must separately provide European-policy evidence. Self-hosted operators choose
their providers, regions, access, retention, and compliance posture, and
receive no hosted residency promise.

## Portability and Self-Hosting Impact

The same package contract applies to hosted and self-hosted Docker
compositions. Supported operating systems and `amd64` or `arm64` container
targets are explicit. Operators can replace an implementation without forking
domain or API code when the replacement passes the capability contract and
conformance suite.

## Operational Impact

More packages create additional version, dependency, image, and release
artifacts, but allow independent rollout, rollback, health, ownership, and
support classification. Shared private utilities must not hide a second
selectable adapter or combine authority.

## Consequences

- Operator registries and composition roots have one discoverable package
  format.
- Every infrastructure implementation is independently testable and releasable.
- Category conformance can evolve without vendor-specific business logic.
- RUN-017 must validate operator selection against both package and runtime
  declarations.
- RUN-018 must execute claimed runtime and external-capability conformance.
- RUN-019 must define the DNS, certificate, and deployment capability ports
  before implementations are selectable.

## Validation

- Repository boundary tests cover every reserved category and every rejection
  rule.
- Each future adapter fixture must prove explicit exports, production runtime
  dependency, and unique runtime declarations.
- Adapter conformance and Docker tests must run for every claimed operating
  system and architecture.
- Startup selection must reject package/runtime manifest mismatch before
  serving traffic.

## Review Triggers

- Operator-installed or third-party adapter loading is introduced.
- A new infrastructure capability category is added.
- Another runtime or container architecture is supported.
- A package needs multiple categories or cannot expose a side-effect-free
  manifest.
- Runtime metadata and package discovery cannot be cross-checked safely.
