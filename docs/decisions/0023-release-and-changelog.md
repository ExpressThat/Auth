# ADR-0023: Version Releases and Changelogs by Public Compatibility Surface

- **Status:** Accepted
- **Date:** 2026-07-24
- **Owners:** Release engineering and security
- **Related tasks:** FND-019, API-013, DX-001 through DX-005, REL-001 through REL-011
- **Supersedes:** None
- **Superseded by:** None

## Context

The monorepo contains private implementation packages, independently deployable
applications, Docker artifacts, public HTTP APIs, generated SDKs,
database migrations, and security fixes. One version counter cannot accurately
describe all of those compatibility surfaces. Completely independent versions,
however, would make it difficult for self-hosted operators to identify a tested
combination or reproduce a hosted release.

Development uses direct, task-sized commits rather than pull requests. Release
metadata therefore needs to be captured during each task without requiring a PR
label or release manager to reconstruct intent later.

## Decision

### Platform releases

ExpressThat Auth platform releases use Semantic Versioning and Git tags of the
form `vMAJOR.MINOR.PATCH`. Before general availability they use `v0.y.z`; GA is
the deliberate `v1.0.0` release after every release gate passes.

Each platform release publishes an immutable manifest that binds:

- source commit and clean-tree status;
- every application, image, Worker, frontend, job, and deployment artifact
  version and digest;
- supported Node, browser, database, queue, cache, and object-store
  compatibility;
- OpenAPI, webhook, event, SDK, adapter, and migration versions;
- included security advisories and dependency attestations;
- documentation and changelog revisions; and
- upgrade, rollback, backup, restore, and known-limit references.

Hosted services may deploy compatible application revisions independently.
That does not create a new public platform release until a tested manifest is
published. Self-hosted support and upgrade statements refer to platform
releases, never an unbound branch commit.

### Applications and deployment artifacts

Deployable applications use SemVer. A release manifest can bind different
application versions when they have been compatibility-tested together.
Immutable artifacts include the application version, source commit, build
provenance, and content digest. Rebuilding the same version with different
content is forbidden; a correction receives a new patch version.

Docker tags and deployment metadata expose immutable version/digest
identities. Mutable convenience tags such as `latest` are never the evidence
used for promotion, rollback, or incident analysis.

### Packages, adapters, and SDKs

Private monorepo-only packages remain `0.0.0` and `private: true`; their
compatibility identity is the source commit and enclosing application build.
They are not silently published.

A package becomes publishable only through an explicit task that removes
`private`, defines exports and support policy, and establishes an independent
SemVer history. Public SDKs version independently by language and declare the
API majors and platform capabilities they support. Published adapters also use
independent SemVer and declare contract, configuration-schema, runtime,
residency, and platform compatibility.

### API and schema versions

ADR-0010 remains authoritative for HTTP API and OpenAPI compatibility. Each
immutable OpenAPI document has its own SemVer `info.version`; the major matches
the public API compatibility boundary. SDK generation consumes the exact
released document digest.

Webhook envelopes, durable events, queue messages, export/import packages,
configuration schemas, and adapter configuration schemas carry independent
integer or SemVer schema versions appropriate to their compatibility model.
Their versions and supported ranges appear in the platform release manifest.

### Database migrations

Every logical schema change has one stable identifier shared by its SQLite and
PostgreSQL implementations. Migration files are immutable after release and are
ordered within each dialect. A release records:

- new migration identifiers and checksums;
- expand, migrate/backfill, contract, or maintenance classification;
- compatible old/new application version ranges;
- lock, duration, capacity, and data-risk assessment;
- backup and restore prerequisites;
- rollback or forward-recovery procedure; and
- whether operator action or downtime is required.

A changed released migration is a supply-chain failure, not a patch. Corrections
are new forward migrations.

### Changelog fragments

Every externally observable task adds one Markdown fragment under `.changes/`.
The fragment names its task, change category, affected audiences and surfaces,
breaking status, migration impact, security handling, and concise user-facing
text. Internal-only work either adds an `internal` fragment or records in task
evidence why no release note applies.

Release preparation validates and folds eligible fragments into `CHANGELOG.md`
under the exact platform version and date. Consumed fragments are removed in
the release commit. The changelog follows Added, Changed, Deprecated, Removed,
Fixed, Security, Migration, and Internal categories. It never contains exploit
details before coordinated disclosure.

### Security releases

Potential vulnerabilities are reported and coordinated privately as described
in `SECURITY.md`. Embargoed advisory material stays outside the public Git
history. The security owner determines affected supported versions, severity,
disclosure timing, CVE/GHSA coordination, hosted mitigation, self-hosted patch
availability, and whether compatibility must be broken to preserve security.

Public advisory, security changelog entry, patched artifacts, checksums,
migration guidance, and supported-version statement are released together.
Revoked or compromised artifacts remain listed as unsafe and are never silently
replaced at the same version.

## Alternatives Considered

### One lockstep version for every workspace

Rejected. Most workspaces are private implementation details, and lockstep
package publication would create meaningless releases and unnecessary consumer
upgrades.

### Fully independent releases without a platform manifest

Rejected. Operators would have no authoritative tested combination, and
rollback, migration, support, and security statements would become ambiguous.

### Generate release notes only from commit messages

Rejected. Commit subjects cannot carry audience, compatibility, migration, and
embargo metadata safely, particularly without a PR workflow.

### Date-only versions

Rejected as the compatibility identity. Dates remain useful in changelogs and
build provenance, but SemVer communicates compatibility boundaries.

## Security Impact

Immutable versions and digests prevent artifact substitution. Private advisory
handling avoids premature exploit disclosure. Release manifests bind security
evidence, dependency state, migrations, and supported versions. Publishing,
signing, and promotion credentials remain outside repository automation and use
least-privilege release identities.

## Privacy and Residency Impact

Release metadata contains no customer data, credentials, or production
telemetry. Examples remain synthetic. Hosted release statements identify
residency-relevant infrastructure evidence; they do not promise that an
operator-selected self-hosted deployment uses the same regions or controls.

## Portability and Self-Hosting Impact

The manifest binds Docker artifacts and states their actual
runtime and adapter support. Self-hosted operators receive explicit migration,
backup, rollback, and compatibility information but no project SLA or
availability guarantee.

## Operational Impact

Release preparation must validate multiple version surfaces and immutable
digests. Independent hosted deployment remains possible, while platform
manifests create reproducible support and rollback points.

## Consequences

- Customer-facing changes are recorded when implemented.
- Public packages and APIs can evolve at appropriate speeds.
- A platform release has more metadata than a single Git tag.
- Release tooling must validate fragments, manifests, migration immutability,
  artifact provenance, and cross-version compatibility.

## Validation

- Validate changelog fragments and platform manifests against schemas.
- Build and hash every artifact from a clean tagged checkout.
- Compare OpenAPI and migration history with the previous release.
- Compile SDK examples against the exact released contract.
- Exercise clean install, upgrade, rollback, backup, and restore procedures.
- Verify signed artifact identities before and after publication.
- Rehearse private advisory and emergency patch workflows without real secrets.

## Review Triggers

- Public packages require coordinated or fixed-version release groups.
- Hosted deployment frequency makes platform release manifests impractical.
- A package registry or artifact format cannot preserve provenance and digest.
- API, event, webhook, adapter, or migration compatibility needs a different
  version model.
- Security disclosure requirements change.

## References

- [Semantic Versioning 2.0.0](https://semver.org/)
- [Keep a Changelog 1.1.0](https://keepachangelog.com/en/1.1.0/)
- [SLSA provenance](https://slsa.dev/spec/v1.2/provenance)
