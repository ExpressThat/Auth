# Continuous Security Analysis

## Purpose

Security analysis is a continuous, fail-closed quality control. It covers
first-party source, dependencies, credentials, generated artifacts, deployment
configuration, and pinned local-development container images. These controls
apply to this source project; they are not a warranty for dependencies,
deployment choices, or availability in an operator's self-hosted installation.

## Local gates

Run the same controls while developing:

```bash
pnpm check:security
pnpm scan:static
pnpm scan:dependencies
pnpm scan:licenses
pnpm scan:artifacts
```

`check:security` validates the exception registry. `scan:static` runs Biome and
the strict TypeScript compiler. The remaining commands audit dependency
advisories, enforce the reviewed licence policy, and reject suspicious binary,
archive, executable, database, environment, or private-key files concealed as
generated source.

CI also runs Gitleaks over complete Git history with redaction enabled. Its
executable and archive checksum are pinned. A credential finding requires
revocation and rotation before history cleanup and access investigation;
deleting the current copy is not remediation.

## CI and schedule

`Security CI` runs source controls on every pushed branch and may be started
manually. A weekly schedule additionally scans every digest-pinned image in the
local Compose stack. Repository filesystem scanning inspects dependencies,
secrets, and deployment misconfiguration with checksum-pinned Trivy.

The checkout is read-only, includes complete history, does not persist GitHub
credentials, and installs only the frozen lockfile. Scanner downloads use TLS,
fixed versions, and independently pinned release checksums. Scanner actions
that execute mutable third-party repository code are deliberately avoided.

All scanners emit SARIF. The repository converts it into a minimized policy
report containing only tool, rule, severity, path, suppression identifier, and
gate outcome. Raw messages never appear in the policy summary. CI preserves
available SARIF and policy JSON for 14 days even when a gate fails.

## Severity policy

The `commit` gate blocks critical and high findings. The `release` gate also
blocks medium findings. Low and informational findings remain visible for
triage. Scheduled third-party development-image scans block high and critical
findings; repository and deployment scans use the release threshold.

Security severity scores take precedence when a SARIF producer supplies them:
9.0 or greater is critical, 7.0 high, 4.0 medium, and a positive lower score is
low. Otherwise SARIF error, warning, note, and none map to high, medium, low,
and informational.

## Expiring suppressions

Suppressions live in `.security/suppressions.json` and are deny-by-default.
Every entry requires:

- an exact scanner, rule, and path without wildcards;
- a unique identifier and scope;
- a named owner, substantive reason, and compensating control;
- a tracking URL;
- creation and expiry dates no more than 90 days apart.

Expired entries fail every gate. High and critical findings cannot be
suppressed. A medium finding may be suppressed only at its exact registered
scope; remediation and removal of the exception remain required.

## Licence policy

The licence gate directly permits Apache-2.0, BlueOak-1.0.0, BSD-2-Clause,
BSD-3-Clause, CC0-1.0, ISC, MIT, `MIT OR Apache-2.0`, and MIT-0. All other
expressions are denied unless a package-and-version exception records a
completed review.

Current narrow exceptions cover the repository's reviewed MPL-2.0 Axe and
Lightning CSS packages and the reported LGPL-based Sharp platform packages.
An upgrade, new package, changed expression, or unknown licence requires a new
review. There is no blanket LGPL, MPL, GPL, AGPL, SSPL, or unknown allowance.

## Triage

Do not suppress a finding simply to restore CI. Establish reachability, update
or remove the component, and test the remediation. For a deployment finding,
correct the checked-in configuration and verify Docker behavior. For a
generated artifact, remove it and make its generator emit safe deterministic
text. Record false positives only through the expiring registry.

Scanner versions, checksums, policies, and exceptions are reviewed during
dependency updates and every release. Self-hosted operators remain responsible
for scanning their chosen images, adapters, infrastructure, and configuration.
