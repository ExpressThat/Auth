# European Data Residency and Transfer Map

- **Status:** Binding hosted baseline
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Privacy, security, platform, and operations engineering
- **Decision:** ADR-0017
- **Provider facts last verified:** 2026-07-23

## 1. Hosted Residency Promise

The hosted service stores and performs platform-controlled processing of
Internal, Confidential, Personal, Credential, and Secret data in the European
Union. Approved disaster-recovery locations also remain in the EU. Public data
can be distributed globally when publication is its intended purpose.

"The application is deployed on Cloudflare" or "the vendor has a European
region" is not evidence. Every data path needs a specific contractual and
technical guarantee for:

- request decryption and application execution;
- primary storage, indexes, replicas, caches, queues, objects, and backups;
- logs, metrics, traces, analytics, alerts, crash/error reports, and support;
- key/secret storage and cryptographic operations;
- scheduled/background processing and provider subrequests;
- control-plane metadata, administration, and remote access; and
- deletion, disaster recovery, incident handling, and subprocessor onward
  transfers.

The default region key is `eu`. A narrower European country region can be added
only as a separate deployment profile. The United Kingdom, Switzerland, or a
generic "Western Europe" location is not silently treated as the EU profile.

This is an engineering control baseline, not legal advice. Privacy counsel
approves controller/processor roles, purposes, legal bases, DPAs, transfer
mechanisms, DPIAs, and customer disclosures before production processing.

## 2. Location and Transfer Concepts

- **Residence/storage** is where persisted copies live.
- **Processing** includes request execution, decryption, query/cache operation,
  queue consumption, logging, support viewing, and remote administration.
- **Transfer** includes access or onward disclosure to a recipient in a third
  country, even when the database remains in Europe.
- **Transit** through a network is not used as storage authority and remains
  encrypted, but endpoints, termination, logs, and provider processing are
  mapped.
- **Public publication** can be worldwide only for fields classified Public.
- **Customer-directed provider transfer** is a distinct, disclosed controller
  instruction and does not broaden the platform's own default processing.

GDPR Chapter V conditions apply to transfers and onward transfers. A contractual
clause alone does not make a non-European service part of the hosted EU region;
transfer impact and supplementary measures still require assessment.

## 3. Approved Hosted Data-Flow Map

| Path | Data | Approved EU rule | Prohibited/default failure |
| --- | --- | --- | --- |
| DNS | Public hostnames and routing records | Global authoritative DNS may serve deliberately public records; account logs follow EU metadata controls | Personal data, secrets, tenant/user identifiers in DNS names/records |
| TLS termination and request execution | Request path/body/cookies/tokens/IP metadata | Hosted/custom identity and management origins use EU Regional Services on supported zone/custom domains; verify continuously | `workers.dev`, unregionalized host, unsupported protocol/product, or silent global fallback |
| Static public assets/discovery/JWKS | Public | May use global cache/CDN with integrity, versioning, and no personal variants | Private/authenticated responses in shared/global cache |
| Browser/API response | All classes needed by caller | Decrypt/process in EU, authorize/minimize, encrypted transit to the user wherever located | Proxy/edge feature that reprocesses content outside approved EU boundary |
| Primary SQL database | Confidential, Personal, Credential, secret references | EU PostgreSQL primary with EU replicas, TLS, encryption, EU administration and support | Global replica, non-EU failover, copied production data, or unsupported location |
| Database connection acceleration | Query text/parameters/results/credentials | Use only after the exact service/profile proves EU processing, cache, metadata, support, and subrequest behavior; otherwise direct approved EU path or EU data-access service | Assume Worker regionalization also regionalizes a database proxy/cache |
| D1, if separately approved | Same as SQL scope | Create with immutable `jurisdiction=eu`; replicas remain inside jurisdiction; pass transaction/backup/restore review | Location hints without jurisdiction, existing non-jurisdiction DB, or automatic global placement |
| Queue and workflow | Tenant context, events, job inputs/results | EU PostgreSQL-backed queue or other adapter with EU storage, processing, dead letter, metrics, support, backup, and consumer execution | Cloud/service queue without documented EU guarantee; payload minimization does not cure unsupported metadata |
| Scheduled jobs | Schedule metadata and job effects | Scheduler and workers run in approved EU containers/services and enqueue through approved EU adapter | Global Cron/consumer execution without verified processing location |
| Object storage | Exports, imports, templates, evidence, logs, backups | EU-jurisdiction bucket/endpoint or approved EU S3-compatible adapter; encrypted objects and lifecycle evidence | Location hint/best effort, global bucket, public development URL, or non-EU replication |
| Cache | Derived values and rate data | Shared EU store with tenant/version scope; security correctness remains in SQL/shared source | Global KV/cache for non-public data, sessions, authorization, replay, or rate-limit authority |
| Durable coordination, if used | State and metadata | Explicit EU-jurisdiction object/namespace plus product qualification and conformance | Unqualified/global object placement or caller-selected jurisdiction |
| Secrets | Provider/database/deployment secrets | EU secret/KMS adapter, reference-only application database, EU operations/support, purpose-bound access | Plain config/env files at rest, globally managed store without evidence, fallback secret |
| Issuer/data encryption keys | Secret/Credential | EU KMS/HSM custody and signing/decryption; EU-contained software custody profile where approved | Export to application/backup/log, global signing operation, non-EU DR key copy |
| TLS private keys | Secret | EU key storage/custody feature or approved keyless/custom-certificate custody | Globally stored exportable TLS key for hosted protected origins |
| Application logs/traces/metrics | Internal, minimal Confidential/Personal | Redact before sink; EU collector/store/query/support; bounded retention; low-cardinality metrics | Raw bodies/headers/tokens, globally stored analytics, out-of-region dashboard/support access |
| Edge traffic logs | IP, URL, request metadata | EU Customer Metadata Boundary and approved EU Logpush destination; disable out-of-region access | Default global metadata handling, unsupported log product, unverified dashboard retention |
| Audit/security evidence | Confidential/Personal | EU append-only store and EU archive, restricted EU access and retention | General debug log, non-EU SIEM/support, credentials or secrets |
| Email/SMS/push | Recipient and message Personal data | Provider instance must declare approved European processing/storage/support; minimize content and retention | Undocumented region, hidden analytics/tracking, provider training/reuse, unsafe fallback |
| Social/enterprise federation | Claims and identifiers | EU platform processing; customer-configured external transfer requires explicit provider metadata, DPA/transfer assessment, disclosure, minimization | Treat arbitrary upstream as part of platform EU residency or send unrelated profile data |
| Webhook/action destination | Event Personal/Confidential data | Customer instruction, exact destination, field minimization, disclosure, signing; transfer metadata recorded | Undisclosed fields, secrets, platform-controlled non-EU default, unsafe redirect |
| Support and impersonation | Personal/Confidential | EU-based authorized personnel and access path by default; step-up/approval/audit; no download | Routine third-country remote access, shared accounts, local copies, uncontrolled screen/session recording |
| Product analytics/RUM | Usage and device Personal data | First-party EU collection only after purpose/consent/minimization review | Third-party/global browser analytics by default |
| Billing/CRM/support system | Customer contacts/usage | EU-hosted approved subprocessor or minimized transfer with separate lawful mechanism and disclosure | End-user credential/profile/audit replication into business systems |
| Build/CI/test | Source, synthetic fixtures, artifacts | No production/customer data; EU artifact store where artifacts/config contain non-public data | Production database snapshots/logs/secrets in CI, support bundles, or public artifacts |
| Backups and disaster recovery | All stored classes | Encrypted EU backup and EU recovery site; separate EU keys; retention and deletion tombstones | Non-EU copy/failover, untested restore, keys stored with ciphertext |

## 4. Cloudflare Hosted Profile

Cloudflare's controls are configured independently and revalidated on every
material product or contract change.

### Required Edge Controls

- Identity, management, API, and account hostnames use a supported zone/custom
  domain and EU Regional Services. `workers.dev` is not a hosted production
  origin.
- The EU region controls where Cloudflare decrypts and services HTTPS traffic.
  Synthetic probes record `Cf-Ray`/colo evidence without sending personal data.
- EU Customer Metadata Boundary is separately enabled for traffic logs and
  analytics. Out-of-region access is disabled.
- EU Geo Key Manager, an approved custom-certificate/keyless arrangement, or
  another approved EU TLS-key custody path is required.
- Product compatibility is checked feature-by-feature. Unsupported CDN, bot,
  analytics, cache, AI, proxy, or protocol features remain disabled.

Regional Services does not cover Worker subrequests. Every `fetch`, binding,
queue, database proxy, object, secret, email, telemetry, and provider call needs
its own residency decision.

### Data Stores

- Hosted PostgreSQL remains the default production system of record in an
  approved EU region with EU replicas/backups.
- Hyperdrive is not automatically approved merely because its origin database
  is European. Before use with non-public data, qualification must cover query
  processing, connection pools, caches, credentials, telemetry, support, and
  failover. Cache-disabled behavior is required for authorization/current-state
  reads even after residency approval.
- D1 can be evaluated only with `jurisdiction=eu` set at creation. It is not
  interchangeable with PostgreSQL and still needs consistency, transaction,
  backup, migration, support, and production-scale approval.
- R2 objects containing non-public data use an EU-jurisdiction bucket and
  jurisdictional endpoint. Public assets use a separate public bucket.
- Workers KV has no approved jurisdictional storage path for non-public hosted
  data and is not used for sessions, authorization, credentials, personal data,
  replay, rate limits, or durable jobs.
- Durable Objects require explicit EU jurisdiction and a dedicated
  storage/execution/backup review before use.
- Cloudflare Queues, Cron Triggers, Workers Workflows, and any other service not
  covered by a current explicit EU guarantee are not approved for non-public
  hosted workloads. The portable EU queue/scheduler profile remains the default.

### Logs and Observability

- Application code emits only the classified, redacted schema defined by
  ADR-0016.
- Customer Metadata Boundary is not assumed to cover every product log. The
  compatibility matrix and dataset list are checked individually.
- Approved request logs use Logpush to an EU-jurisdiction object store or another
  approved EU sink. Log Explorer is disabled when its managed storage location
  cannot be selected.
- Workers Logs, dashboard analytics, tailing, crash reporting, alerting, and
  third-party observability are disabled for non-public production data unless
  their exact path, retention, access, and EU guarantee are approved.
- Operations access logs through EU-controlled identities and locations. Vendor
  out-of-region support access requires incident-specific privacy/security
  approval and an applicable transfer process; it is not routine.

## 5. Docker Hosted Profile

All production containers, ingress/TLS termination, API/job/scheduler processes,
PostgreSQL, cache, queue, object store, KMS/secrets, logs, monitoring, backups,
registry mirrors carrying private artifacts, and administration endpoints run in
approved EU facilities.

- Multi-region resilience uses EU regions only.
- Network policy restricts egress to approved EU infrastructure and configured
  customer/provider destinations.
- Containers are stateless and unprivileged; local disks contain no durable
  production data, secrets, or exports.
- Orchestrator metadata, snapshots, crash dumps, console logs, and managed
  control-plane/support access are included in vendor assessment.
- Restore/failover tooling refuses a destination without the same region policy.

Cloudflare-hosted Workers and EU Docker services may be combined only through
encrypted, authenticated EU endpoints with an approved data-flow entry. A
fallback from one runtime to the other cannot leave the EU or change data
handling.

## 6. Self-Hosted Profile

Self-hosted operators may select any infrastructure, vendor, support model, and
region, including locations outside Europe. They are responsible for their
controller/processor roles, legal controls, remote access, backups, failover,
subprocessors, and transfers. The hosted data map does not apply automatically
and the product does not claim that an arbitrary Docker installation is
European or GDPR compliant.

The deployment validator offers an optional `eu-resident` policy. When selected,
every adapter must declare storage, processing, backup, support, and failover
locations, and unknown, global, conflicting, or insufficient capability fails
that profile. An operator may instead choose an unrestricted or custom policy.
Such a deployment is shown as `operator-managed / EU residency not verified`,
not as having inherited hosted residency and not as universally illegal or
unsupported.

Passing the validator is not legal advice, GDPR certification, or proof about
undisclosed infrastructure and operating practice. The full boundary is defined
in the
[hosted and self-hosted responsibility policy](../operations/hosted-self-hosted-responsibility.md).

Documentation maps database, queue, cache, object, secret, key, telemetry,
provider, backup, and support responsibilities. Diagnostics export the safe
residency manifest and evidence status without secrets.

## 7. Provider and Subprocessor Approval

Every hosted subprocessor/provider entry records:

- legal entity, service, purpose, controller/processor role, and data classes;
- storage, processing, support, backup, failover, and key locations;
- onward subprocessors and change-notification terms;
- DPA, Article 28 terms, deletion/return, breach notice, audit evidence, and
  retention;
- transfer mechanism, transfer impact assessment, and supplementary measures
  for any third-country access or onward transfer;
- customer choice/notification, application/end-user disclosure, and consent or
  other legal basis where applicable;
- technical adapter capability and configuration evidence;
- owner, approval/review date, expiry, incident contact, and exit plan.

A customer-configured provider can create a disclosed transfer outside the EU
only when the customer is authorized to instruct it, the platform validates an
applicable legal/configuration policy, and data is minimized. Such a provider is
not a hosted default or failover and is clearly shown in the admin UI and export.
Platform-selected subprocessors must meet the EU hosted baseline unless privacy
counsel approves and product terms clearly disclose an exceptional transfer.

## 8. Data-Flow and Deployment Enforcement

The adapter capability model includes machine-readable:

- storage, processing, key, backup, support, and failover jurisdictions;
- whether location is guaranteed, best-effort, customer-configured, or unknown;
- product/plan/contract prerequisites and evidence expiry;
- data classes and operations supported in each region;
- subrequest/onward-transfer behavior; and
- deletion, export, audit, and incident capabilities.

Composition roots resolve these against deployment, tenant, environment, and
purpose policy. Unknown or expired evidence fails closed for non-public data.
Runtime code cannot select a different region or provider from request input.

IaC/policy checks reject non-EU resources, global replicas, public object access,
unregionalized hostnames, default/global logs, unsupported bindings, and
out-of-region support. Region and residency state is observable without emitting
personal data.

## 9. Evidence and Continuous Verification

Production readiness and quarterly review retain:

- vendor contracts, DPAs, subprocessor lists, product compatibility and plan
  entitlements;
- region/jurisdiction configuration exports and immutable resource identifiers;
- DNS/Regional Services synthetic probes and metadata-boundary checks;
- database/replica/backup/object/queue/cache/KMS/telemetry/support region
  attestations;
- egress inventories and synthetic canary flows;
- deployment-policy and adapter-capability conformance results;
- deletion, backup/restore, failover, export, incident, and support-access drills;
  and
- review owners, dates, changes, exceptions, expiry, and remediation.

Automated drift checks run on deployment and schedule. A missing guarantee,
provider change, new subprocessor, unexpected endpoint, out-of-region access,
unregionalized request, or non-EU resource is a security/privacy finding and can
disable the affected capability.

## 10. Current Provider Facts Behind the Baseline

As of the verification date:

- Cloudflare documents Regional Services as controlling where HTTPS is decrypted
  and processed, while Customer Metadata Boundary separately controls where
  traffic logs/analytics are stored.
- Cloudflare documents that Regional Services does not apply to Worker
  subrequests.
- Cloudflare documents EU jurisdiction options for D1 and R2. D1 jurisdiction is
  immutable at creation; jurisdiction-constrained replicas remain within it.
- Cloudflare's localization compatibility matrix states that Workers KV does not
  have jurisdictional storage restrictions and that Log Explorer's managed R2
  storage location cannot be chosen.
- Services absent from a current explicit compatibility/contract guarantee are
  treated as unapproved, not inferred safe.

These facts are configuration inputs, not permanent architectural assumptions.
The provider-fact review is repeated before enabling or upgrading a capability.

## References

- [GDPR, including Chapter V transfers](https://eur-lex.europa.eu/eli/reg/2016/679/oj)
- [European Commission Standard Contractual Clauses](https://commission.europa.eu/law/law-topic/data-protection/international-dimension-data-protection/standard-contractual-clauses-scc_en)
- [EDPB Recommendations 01/2020 on supplementary measures](https://www.edpb.europa.eu/documents/recommendation/recommendations-012020-on-measures-that-supplement-transfer-tools-to_en)
- [Cloudflare Data Localization Suite](https://developers.cloudflare.com/data-localization/)
- [Cloudflare product compatibility](https://developers.cloudflare.com/data-localization/compatibility/)
- [Cloudflare localization limitations](https://developers.cloudflare.com/data-localization/limitations/)
- [Cloudflare Customer Metadata Boundary](https://developers.cloudflare.com/data-localization/metadata-boundary/)
- [Cloudflare D1 data location](https://developers.cloudflare.com/d1/configuration/data-location/)
- [Cloudflare R2 localization guide](https://developers.cloudflare.com/data-localization/how-to/r2/)
- [Cloudflare Hyperdrive architecture](https://developers.cloudflare.com/hyperdrive/concepts/how-hyperdrive-works/)
