# ADR-0016: Classify and Describe Every Boundary Field

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Security, privacy, and data engineering
- **Related tasks:** DEC-017, FND-013, GOV-001 through GOV-019
- **Supersedes:** None
- **Superseded by:** None

## Context

Identity data moves through APIs, tokens, databases, queues, providers, logs,
exports, caches, objects, backups, and support tools. A rule such as "do not log
secrets" is not enforceable when fields have no classification or destination
policy. Encryption also cannot turn a credential into ordinary data.

## Decision

Adopt [the platform data classification and handling standard](../security/data-classification.md).
Every boundary field has one or more of these classes:

- Public;
- Internal;
- Confidential;
- Personal;
- Credential; and
- Secret.

Overlapping fields apply all rules and the most protective outcome. Unknown data
defaults to Confidential and is excluded from logs, metrics, traces, and exports
until classified.

Implement a runtime-neutral descriptor registry that records purpose, scope,
allowed destinations, storage/encryption, retention, export, deletion,
redaction, and test-fixture behavior. Public contracts and persistence mappings
refer to the same policy source where practical; no generic database-row export
or request-object logging is permitted.

Ordinary exports never contain reusable credentials or secrets. An eligible
password-hash migration uses a separate high-risk, target-encrypted workflow.
Customer provider secrets are re-entered at a destination unless a future
separately reviewed transfer capability is approved.

## Alternatives Considered

### Public, Private, and Secret Only

Rejected. It cannot express personal-data rights, offline password-hash risk,
tenant-owned configuration, or safe public-key publication.

### Infer Policy from Property Names

Rejected. Names are inconsistent, derived values remain sensitive, and context
changes whether an identifier is personal or public.

### Encrypt Everything and Treat It Equally

Rejected. Encryption is defense in depth; access, logging, retention, export,
purpose, and deletion still differ materially.

## Security Impact

Credential/secret sinks become deny-by-default and testable. Purpose-specific
hashing, encryption, custody, redaction, retention, and incident response reduce
credential leakage and secondary data exposure.

## Privacy and Residency Impact

Personal data gains explicit purpose, minimization, controller, rights,
retention, export, copy, and deletion behavior. Every non-public class uses
approved European storage/processing paths mapped by DEC-018.

## Portability and Self-Hosting Impact

Classification is domain metadata, not a hosted provider feature. Self-hosted
adapters must declare how they satisfy the same handling contract and surface
unsupported guarantees before startup.

## Operational Impact

New boundary fields require classification and tests. Central descriptors add
maintenance but allow consistent logs, exports, deletion, fixtures, and provider
redaction rather than repeated allow-lists.

## Consequences

- Unknown fields fail safely instead of leaking through generic serializers.
- Export completeness and credential exclusion are both explicit.
- Backups, caches, analytics, and derived data inherit source sensitivity.
- Some legitimate debugging requires restricted, purpose-built diagnostics.

## Validation

- Classify every entity and security asset currently named in the architecture
  and threat model.
- Add canary leak tests for all output/observability sinks.
- Test retention and deletion across declared copies and restore.
- Test ordinary and protected migration exports independently.
- Run descriptor/conformance behavior directly, in Docker, and across database dialects.

## Review Triggers

- Any trigger in the handling standard.
- A class cannot express a new legal, protocol, or security requirement.
- A generic serialization, analytics, or support feature is proposed.
