# Release and Changelog Process

This process applies to hosted and self-hosted platform releases, deployable
applications, public packages and SDKs, OpenAPI documents, migrations, and
security advisories. ADR-0023 defines the binding version model.

## During every task

1. Decide which public, operator, user, administrator, security, privacy, or
   migration behavior changes.
2. Add or update the affected documentation in the same task.
3. Add one `.changes/<task-id>-<slug>.md` fragment for externally observable
   behavior. Use `audiences: internal` for release-relevant engineering changes.
4. If no fragment applies, state why in the completed task evidence.
5. Never put embargoed vulnerability details, credentials, customer data, or
   production evidence in a fragment.

Fragments describe outcomes rather than implementation mechanics. One fragment
may list several affected surfaces when they cannot be released independently.

## Version selection

Use the smallest SemVer increment that honestly represents the affected public
surface:

- **Patch** — compatible defect or security fix, documentation correction, or
  implementation change that preserves public behavior.
- **Minor** — backward-compatible capability, endpoint, optional field,
  provider, adapter, SDK helper, or operator feature.
- **Major** — an incompatible public contract or supported-operation change.
  Follow ADR-0010 deprecation and migration rules.

During pre-GA, incompatible changes may increment the minor `0.y` version, but
they still require explicit breaking metadata and migration guidance. `v1.0.0`
is created only by the GA release task.

Private `0.0.0` workspaces are not version-bumped. If a workspace becomes
public, establish its first independent release explicitly.

## Prepare a release candidate

1. Select a clean source commit and freeze the candidate inputs.
2. Inventory unconsumed change fragments and confirm their audience, category,
   breaking, migration, and security metadata.
3. Compare every affected OpenAPI document against its last release.
4. Compare migration histories and reject edits to released migrations.
5. Select platform, application, public package, SDK, OpenAPI, adapter, event,
   webhook, configuration, and migration versions.
6. Generate a candidate platform release manifest containing exact source,
   artifact, contract, migration, documentation, and compatibility identities.
7. Fold eligible fragments into `CHANGELOG.md` beneath the candidate version.
8. Write upgrade, rollback, backup/restore, known-limit, deprecation, and
   operator-action notes.
9. Keep embargoed advisory text private until coordinated publication.

Release preparation is deterministic. Re-running it from the same clean commit
must produce byte-identical generated documents before signing metadata is
added.

## Validate the candidate

Run the clean-checkout gate plus release-specific validation:

- all format, lint, type, boundary, file-size, test, coverage, build, package,
  dependency, licence, credential, artifact, and deployment checks;
- Docker and Workers runtime and deployment conformance;
- OpenAPI linting, breaking-change analysis, response verification, generated
  SDK compilation, and safe examples;
- empty install and supported upgrade paths for SQLite and PostgreSQL;
- migration checksums, expand-and-contract compatibility, rollback or
  forward-recovery, backup, and restore;
- multiple-instance, queue redelivery, dependency-failure, rolling-release, and
  smoke tests appropriate to the release;
- documentation links, examples, responsibility boundaries, and generated
  artifact drift; and
- security finding ownership with no unaccepted critical or high findings.

Failed evidence invalidates the candidate. Do not reuse its final version for
different content if artifacts were exposed outside the controlled build.

## Build and publish

Publication is an explicit externally stateful operation and requires approved
release credentials:

1. Build every artifact once from the validated commit.
2. Record content digests, software bill of materials, provenance, signatures,
   and dependency/security evidence.
3. Apply immutable versions and tags; never base promotion on a mutable tag.
4. Publish versioned documentation, OpenAPI, SDKs, images, Workers metadata,
   migrations, checksums, release manifest, changelog, and known limits as one
   coordinated release.
5. Publish security advisories only when patched supported artifacts are
   available and hosted mitigation/disclosure timing is approved.
6. Verify downloads and signatures from outside the build environment.
7. Run post-publication smoke, install, and upgrade checks.
8. Mark the release available only after verification succeeds.

The repository automation can prepare and validate artifacts without
credentials. It must not claim that registries, Workers, images, signatures, or
advisories were published when live credentials were unavailable.

## Hosted rollout

Hosted rollout uses the same immutable artifacts but may deploy them
progressively. Record cohort, start/end times, health evidence, migration state,
rollback point, and incident linkage. Hosted commitments come only from the
hosted operator's applicable policies or contracts.

Self-hosted operators choose when and where to deploy. Release notes provide
tools, compatibility, and evidence, not an uptime, residency, backup, recovery,
or support guarantee for their infrastructure.

## Rollback and revocation

- Roll back application artifacts only within the documented schema and event
  compatibility window.
- Never roll back a database blindly. Use the release's tested rollback or
  forward-recovery procedure.
- If an artifact is compromised or materially defective, mark its immutable
  digest and version revoked, publish a replacement version, and update the
  advisory and supported-version table.
- Never replace content behind an existing immutable version.
- Preserve release manifests and revocation records for incident and audit
  history.

## Required release outputs

- Git tag and source commit
- Platform release manifest and digests
- Changelog and release notes
- Versioned Docker, Workers, frontend, job, and deployment artifacts
- Versioned OpenAPI documents and Swagger-compatible documentation
- Generated SDKs and tested examples
- Migration files, checksums, compatibility, and recovery notes
- SBOM, provenance, signatures, licence and vulnerability evidence
- Security advisories and supported-version statement where applicable
- Installation, upgrade, rollback, backup, restore, and known-limit guides
