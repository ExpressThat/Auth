# Dependency and Credential Scanning

## Purpose

The repository rejects known high-severity dependency vulnerabilities,
unreviewed dependency licences, suspicious files concealed as generated source,
and credentials committed anywhere in Git history. These controls apply to the
source project and are not a warranty about dependencies added or configuration
chosen by a self-hosted operator.

## CI gates

`Security CI` runs on every pushed branch and can be started manually. It uses a
read-only, full-history checkout without persisted GitHub credentials and a
frozen dependency installation.

- `pnpm scan:dependencies` runs the pnpm advisory audit for production and
  development dependencies and fails for high or critical findings.
- `pnpm scan:licenses` inventories the installed dependency graph and applies
  the reviewed licence policy below.
- `pnpm scan:artifacts` rejects binary, archive, executable, database,
  environment, and private-key material in generated-source paths.
- Gitleaks scans complete Git history using its maintained rules. The executable
  version and archive checksum are pinned, findings are redacted, and a SARIF
  report is produced in the ephemeral runner directory.

Failures retain the package, version, licence, file path, rule, and commit
context needed for review while redacting detected secret values.

## Licence policy

The dependency gate is deny-by-default. The directly allowed permissive
expressions are:

- Apache-2.0
- BlueOak-1.0.0
- BSD-2-Clause
- BSD-3-Clause
- CC0-1.0
- ISC
- MIT
- MIT OR Apache-2.0
- MIT-0

The following non-permissive or weak-copyleft cases were reviewed for their
current use and are encoded as package-and-version exceptions:

- `@axe-core/playwright` and `axe-core` 4.12.1 under MPL-2.0.
- `lightningcss` and its platform packages 1.33.0 under MPL-2.0.
- Sharp libvips platform packages 1.3.1 under LGPL-3.0-or-later, and the
  Windows Sharp platform binary 0.35.2 under its reported combined Apache-2.0
  and LGPL-3.0-or-later expression.

An upgrade, a new package under one of those licences, a changed licence
expression, or an unknown licence fails the gate and requires a fresh review.
The policy deliberately does not broadly allow LGPL, MPL, GPL, AGPL, SSPL, or
unidentified licences.

## Triage

Never suppress a finding merely to restore CI:

1. For an advisory, establish reachability and update, replace, or remove the
   dependency. A temporary exception requires a documented security decision,
   owner, expiry, and compensating control.
2. For a licence failure, verify the package's authoritative licence and usage.
   Add only the narrowest reviewed package-and-version exception.
3. For a generated artifact, remove it and change the generator to emit safe,
   deterministic text. Store release binaries outside generated source.
4. For a credential, revoke and rotate it first, then remove it from the entire
   Git history and investigate access. Deleting it only from the latest commit
   is insufficient.

Scanner versions and policies are reviewed during dependency updates and every
release. Scheduled and machine-readable security reporting is added by the
later continuous-security backlog tasks.
