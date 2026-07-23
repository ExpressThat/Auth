# Hosted and Self-Hosted Responsibility Boundary

- **Status:** Binding product and documentation policy
- **Applies to:** Hosted service, self-hosted software, documentation, UI,
  support, release profiles, benchmarks, and commercial claims
- **Owners:** Product, legal/privacy, security, platform, and operations

## 1. Principle

The hosted service and self-hosted software share domain behavior, protocols,
API contracts, security invariants, conformance suites, and portable deployment
paths. They do not share an operator or the same operational commitments.

The open-source project, its repository, contributors, roadmap, documentation,
test results, and community make no service promise. A separate hosted operator
can make commitments only for the hosted infrastructure and processing it
controls, through its applicable published policies and contracts. A
self-hosted operator controls its deployment and is responsible for the
outcomes of those choices.

## 2. Hosted Service

For the hosted service, the platform operator owns and can evidence:

- approved European regions and data paths;
- infrastructure and adapter selection, capacity, scaling, and availability;
- backups, restore testing, disaster recovery, and hosted RPO/RTO objectives;
- monitoring, incident response, vulnerability remediation, and patching;
- keys, secrets, certificates, DNS automation, and privileged support access;
- hosted subprocessors, transfer assessments, contracts, retention, and privacy
  operations; and
- published hosted SLOs, support commitments, and any contractual SLA.

Hosted commitments apply only to the hosted service and only when stated by its
operator in applicable terms, privacy notice, data-processing agreement, support
policy, SLA, or customer contract. Product plans and engineering targets are not
themselves contractual promises.

## 3. Self-Hosted Software

A self-hosted operator may deploy the software on any platform, infrastructure,
provider, or region that it chooses, including outside Europe. It selects and
operates the database, queues, object storage, cache, key and secret custody,
email and SMS providers, observability, networking, backups, support access,
and every other adapter or dependency.

The self-hosted operator is responsible for:

- lawful processing, controller/processor roles, notices, contracts,
  subprocessors, transfers, retention, and data-subject requests;
- deployment regions, data residency, remote access, logs, backups, replicas,
  failover, and deletion;
- security configuration, access control, keys, secrets, patching, upgrades,
  vulnerability response, and incident or breach response;
- architecture, capacity, scaling, high availability, monitoring, maintenance,
  backup integrity, restore testing, disaster recovery, and its own RPO/RTO;
- DNS, certificates, email deliverability, enterprise integrations, and support;
  and
- validating that its complete deployment meets its laws, policies, risk
  appetite, and customer commitments.

The project does not guarantee the uptime, availability, latency, throughput,
capacity, scalability, security, backup integrity, recoverability, RPO/RTO,
European residency, or GDPR compliance of an arbitrary self-hosted deployment.
Installing or configuring the software does not by itself establish any of
those outcomes.

## 4. What the Project Provides

The self-hosted product provides:

- secure defaults and fail-safe validation;
- typed adapter contracts and portable production implementations;
- documented reference architectures and sizing information;
- conformance, load, failure, backup, restore, upgrade, and security test tools;
- capability and residency declarations for adapters;
- optional deployment-policy profiles, including an `eu-resident` profile;
- export, retention, deletion, privacy-request, and audit capabilities; and
- signed releases, upgrade guidance, known limitations, and security advisories.

These are tools and evidence inputs, not a certification or warranty for the
operator's complete installation.

The project is distributed under the MIT License, copyright 2026 ExpressThat
LTD. Its standard "as is" software disclaimer does not create or replace hosted
terms, a privacy notice, a DPA, a support policy, an SLA, or a customer contract.

## 5. Profiles, Validation, and Benchmarks

The `eu-resident` profile is opt-in for self-hosted deployments. It checks
declared technical capabilities against that selected policy. A self-hosted
operator may instead select an unrestricted or custom policy and may knowingly
use non-European or globally distributed services.

Passing a validator means the inspected configuration satisfied the selected
technical rules at that time. It is not legal advice, a GDPR certification, an
independent audit, or proof about undisclosed infrastructure and operational
practice. Deployments without the EU profile are labelled
`operator-managed / EU residency not verified`, not incorrectly described as
globally non-compliant.

Published self-hosted topologies and benchmarks apply only to their named
versions, configuration, workload, and infrastructure. They are reproducible
reference results, not an SLA or a prediction for another installation.

## 6. Data Ownership and Privacy Operations

Customer organisations and users retain the data rights described by the
product model. The software exposes export, portability, correction, retention,
restriction, objection, consent-withdrawal, and erasure workflows.

For the hosted service, the platform operates the responsibilities assigned to
it by the applicable controller/processor relationship. For self-hosting, the
self-hosted operator must configure and operate those workflows, respond to data
subjects, apply lawful exceptions, expire backups, maintain evidence, and name
the correct privacy contact. Data subjects of a self-hosted installation must
be directed to that installation's operator.

The project cannot inspect, execute, or verify a self-hosted operator's privacy
operations unless a separate, explicit service agreement authorizes access.

## 7. Security and Support

Security invariants and defensive defaults apply to both editions, but a
self-hosted root operator can replace software, read keys or data, disable
controls, or expose services. Documentation and validation cannot override that
authority.

The software contains no vendor support backdoor. Any vendor access to a
self-hosted deployment requires a separate agreement, explicit operator-granted
access, least privilege, time limits, and auditable controls.

## 8. Documentation and Product Language

Every self-hosted release profile, installation guide, benchmark, deployment
screen, and support document must:

- distinguish functional compatibility from an operational guarantee;
- identify operator-owned dependencies and decisions;
- state whether a target applies only to the hosted service or to a named
  reference topology;
- avoid presenting validation as legal compliance or certification; and
- never imply that hosted residency, SLA, SLO, support, or recovery commitments
  transfer to self-hosted deployments.
