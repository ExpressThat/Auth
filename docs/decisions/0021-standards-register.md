# ADR-0021: Pin and Own Protocol and Security Standards

- **Status:** Accepted
- **Date:** 2026-07-23
- **Owners:** Protocol and security engineering
- **Related tasks:** DEC-022, OIDC-001 through OIDC-027, SEC-001 through SEC-032
- **Supersedes:** None
- **Superseded by:** None

## Context

The platform implements or consumes OAuth, OIDC, JOSE, WebAuthn, SAML, SCIM,
webhooks, HTTP/browser security, password, and cryptographic behavior. Standards
overlap, receive errata, or remain drafts for years. Linking only to a "latest"
page can silently change a security contract.

## Decision

Adopt [the protocol and security standards register](../security/standards-register.md).

The register pins stable references and exact draft snapshots, assigns owners,
separates Required/Profiled/Planned/Reference/Rejected/Monitor status, and records
the platform profile. Draft or living standards never become production
capabilities without exact version, threat review, conformance, migration,
runtime evidence, and an ADR.

Protocol owners monitor errata, status, vulnerabilities, libraries, browser
behavior, and conformance suites automatically and review the full register
quarterly and before releases/upgrades.

## Alternatives Considered

### Always Implement the Latest Draft

Rejected. Wire/security behavior could change without compatibility review and
customers could not reproduce a release.

### Use Only Stable RFCs

Rejected. Necessary browser behavior and emerging interoperable profiles can be
draft/living specifications, but must be isolated and explicitly tested.

### Let Libraries Define the Protocol Profile

Rejected. A library can support unsafe/irrelevant options and cannot own product
tenant, consent, policy, privacy, or compatibility decisions.

## Security Impact

Unsafe grants/algorithms and partial draft behavior are explicitly rejected.
Security BCPs, errata, negative vectors, and conformance evidence have owners and
review triggers.

## Privacy and Residency Impact

Protocol profiles minimize claims and bind consent/purpose. Conformance fixtures
are synthetic, and adopting a federation/provider feature still requires the
European transfer review.

## Portability and Self-Hosting Impact

The same registered profile and black-box conformance applies to Workers and
Docker. A runtime/library cannot add an unsupported protocol capability.

## Operational Impact

Monitoring and quarterly reviews create maintenance work. Exact draft/library
pins improve reproducibility but require planned migrations when standards
advance.

## Consequences

- Product support claims name an exact profile and evidence.
- Drafts remain disabled unless deliberately adopted.
- Dependency upgrades cannot silently change protocol behavior.
- Certification supplements rather than replaces local security/tenant tests.

## Validation

- Map every protocol/security capability in the backlog to a registered
  standard, explicit local contract, or rejected status.
- Verify exact links/maturity and assign every row to an ownership area.
- Run pinned vectors and external conformance plans on both runtimes.
- Exercise the change process on the next standards/library update.

## Review Triggers

- Any registered document publishes errata, revision, final/RFC, or replacement.
- A library, browser, runtime, proxy, or conformance suite changes behavior.
- A new protocol, extension, algorithm, grant, or application profile is
  proposed.

