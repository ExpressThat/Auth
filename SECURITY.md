# Security Policy

## Reporting a vulnerability

Do not open a public issue, discussion, change fragment, or pull request for a
suspected vulnerability.

Use [GitHub private vulnerability reporting](https://github.com/ExpressThat/Auth/security/advisories/new)
to contact the maintainers privately. Include the affected version or commit,
deployment profile, reproducible steps, impact, and any safe proposed
mitigation. Do not include real customer data, credentials, tokens, private
keys, or production exports.

If private reporting is temporarily unavailable, contact ExpressThat LTD using
a verified private channel published by the
[ExpressThat GitHub organisation](https://github.com/ExpressThat) and reference
this repository. Do not disclose the issue publicly while a private channel is
being established.

## What to expect

The security owner will:

1. acknowledge and restrict the report;
2. establish severity, affected supported versions, exploitability, and hosted
   or self-hosted exposure;
3. coordinate mitigation, patch, regression evidence, advisory/CVE handling,
   release timing, and communication;
4. make patched immutable artifacts and verification information available
   before or with public disclosure; and
5. credit reporters who request and can safely receive credit.

Exact response targets and severity rules are defined in the
[security and reliability targets](docs/operations/security-reliability-targets.md).
Targets for the open-source project are engineering policy, not an SLA.

## Supported versions

The project is pre-GA and has not published a supported production release.
Branch snapshots and `0.0.0` private workspace versions are unsupported.

When releases begin, this section will list supported platform versions and the
release manifest will bind their exact applications, APIs, migrations, and
artifacts. A version removed from support or revoked for security reasons will
remain visible with migration guidance.

## Disclosure and releases

Embargoed details remain outside public Git history and change fragments.
Security fixes receive regression tests where technically possible, complete
dependency and credential scans, affected-version analysis, and coordinated
hosted mitigation and self-hosted patch guidance.

Public disclosure includes the advisory, severity, affected and fixed versions,
artifact digests, verification steps, upgrade or migration guidance, and safe
workarounds. An immutable artifact is never silently replaced at the same
version.

Self-hosted operators control their platform, region, configuration, patch
timing, monitoring, backups, and incident response. Project documentation and
release evidence do not create an uptime, residency, compliance, recovery, or
support guarantee for an operator's installation.
