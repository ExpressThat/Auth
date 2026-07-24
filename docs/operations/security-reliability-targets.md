# Security and Reliability Targets

- **Status:** Binding hosted general-availability targets; self-hosted references
  only
- **Version:** 1.0
- **Date:** 2026-07-23
- **Owners:** Security, SRE, platform, and identity engineering
- **Decision:** ADR-0020

## 1. Scope and Measurement

These targets define production acceptance for the hosted EU service and
reference profiles for self-hosted deployments. Production beta must collect the
same indicators and demonstrate a credible path to the targets; hosted general
availability requires meeting them through representative load, failure,
restore, and incident exercises.

Only the operated hosted service can receive these SLO and recovery commitments,
and product targets are not contractual promises unless incorporated into an
applicable hosted policy or agreement. Self-hosted operators set and prove their
own availability, performance, capacity, backup, and RPO/RTO objectives. The
project makes no guarantee for unknown operator infrastructure. See the
[hosted and self-hosted responsibility boundary](hosted-self-hosted-responsibility.md).

An SLI counts eligible requests from the public service boundary:

- numerator: requests that return the correct contract result within the latency
  threshold;
- denominator: syntactically valid requests that are permitted to reach that
  operation, including platform/dependency failures and legitimate requests
  rejected because the platform lacks capacity.

Expected policy denials, invalid/expired credentials, customer quota enforcement,
malicious traffic blocked by abuse controls, and caller cancellation do not
count as service failures. Incorrect success, authorization bypass, cross-tenant
response, stale security result, missing audit, or fail-open response always
counts as failure even when the HTTP status is 2xx.

Planned maintenance, cold starts, deployments, migrations, failover, and
platform-selected dependency failures count. A customer-selected external
identity/provider outage has a separate provider SLI, but the platform must still
return its correct bounded failure within the API target.

Hosted measurements use server-side monotonic duration from accepted request to
completed response, including platform dependencies, cold start, queue
admission, and cryptographic work. Internet/user-device time and human/provider
interaction time are measured separately. Percentiles are calculated per
operation class and globally over rolling five-minute, one-hour, and 28-day
windows; tenant weighting is monitored so one large tenant cannot hide broad
failure.

Security, tenant, personal, Credential, and Secret values never become metric
labels. Synthetic probes use dedicated tenants and credentials.

## 2. Availability SLOs

| Tier | Operations | Monthly availability |
| --- | --- | --- |
| T0 — Trust metadata | Issuer discovery, OAuth metadata, JWKS, public status needed for token verification | 99.99% |
| T1 — Existing access | Token, refresh, client credentials, introspection, revocation, session validation, authorization continuation, logout | 99.95% |
| T2 — Interactive identity | Sign-in/sign-up, password/passkey/MFA/recovery, consent, account, organisation switching | 99.95% |
| T3 — Management | Organisation/application/user/policy/provider/audit management and management sign-in | 99.9% |
| T4 — Durable asynchronous | Accepted audit/outbox, notifications, webhooks, imports/exports, privacy/deletion and provisioning jobs | 99.9% accepted and durably retained; timeliness uses queue targets |

Availability is measured per EU hosted region and as the customer-visible
service. No single tenant, application, endpoint, or runtime can remain below
its tier target for three consecutive days while the aggregate is reported as
healthy.

The 28-day error budgets are approximately:

- T0: 4 minutes;
- T1/T2: 20 minutes;
- T3/T4: 40 minutes.

Budget burn alerts use multi-window rates. A two-percent budget burn in one hour,
ten-percent in six hours, or projected exhaustion before the window ends pages
the service owner. Exhaustion pauses ordinary risky releases until reliability
recovers and corrective work is owned. Security/privacy correctness has no error
budget and never permits a fail-open response.

## 3. Latency Targets

Targets apply under the reference sustained load with less than 70% of the
bottleneck resource consumed and exclude intentional client-facing rate-limit
delay. All Docker replicas must meet the same user-facing
thresholds, even when their internal budgets differ.

| Operation class | p50 | p95 | p99 |
| --- | ---: | ---: | ---: |
| Cached discovery/JWKS/health-safe public metadata | 50 ms | 100 ms | 250 ms |
| Token refresh, client credentials, introspection, revocation | 100 ms | 250 ms | 750 ms |
| Session validation and ordinary authorized read | 75 ms | 250 ms | 750 ms |
| Passkey, TOTP, consent, organisation switch, ordinary mutation | 150 ms | 500 ms | 1,000 ms |
| Password sign-in including Argon2id | 750 ms | 2,000 ms | 3,000 ms |
| Management/account list or mutation excluding long jobs | 200 ms | 600 ms | 1,500 ms |
| Job acceptance after request validation | 100 ms | 300 ms | 1,000 ms |

Every operation also has an explicit hard server timeout and dependency sub-
budget shorter than the caller deadline. Slow dependencies do not cause
unbounded work. Upstream federation, email/SMS delivery, large exports/imports,
SCIM sync, domain/certificate provisioning, and deletion are asynchronous or
publish separate provider/job targets.

Latency cannot be improved by reducing password work factors, skipping current
authorization, omitting audit/outbox, weakening cryptography, serving stale
security state, or moving data outside the EU.

## 4. Reference Capacity and Scaling

The initial hosted GA EU deployment must sustain for at least 60 minutes:

| Workload | Sustained | Five-minute burst |
| --- | ---: | ---: |
| Token endpoint excluding password grant (not supported) | 1,000 requests/s | 2,000 requests/s |
| Mixed authenticated API/session validation | 2,000 requests/s | 4,000 requests/s |
| Password sign-in/verification | 100 requests/s | 200 requests/s |
| Passkey/MFA/interactive authentication completions | 250 requests/s | 500 requests/s |
| Audit/outbox ingestion | 5,000 events/s | 10,000 events/s |
| Webhook/notification job acceptance | 1,000 jobs/s | 2,000 jobs/s |

At sustained load, availability/latency targets hold, no security queue is
starved, and database/connection/CPU/memory/key/queue bottlenecks retain at least
30% measured headroom. Admission control preserves management recovery, token
revocation, security notifications, and audit ahead of bulk exports or low-
priority delivery.

Scaling acceptance proves:

- adding an API or worker instance increases safe throughput by at least 70% of
  the preceding instance's contribution until a documented shared bottleneck;
- an instance can terminate at any point without lost/duplicate unauthorized
  effects;
- mixed-version Docker replica release overlap preserves contracts and state;
- overload produces bounded 429/503 with `Retry-After`, no unbounded queue/memory,
  and no tenant monopolization; and
- scale-down drains leases/connections and does not abandon authority-changing
  work.

These numbers are launch capacity targets, not contractual per-customer quotas.
Capacity is re-baselined from observed peaks, and production maintains at least
two times the recent 30-day peak for T1/T2 demand or an approved autoscaling
proof that reaches it within five minutes.

Self-hosted releases publish benchmark results and sizing for named reference
topologies. The product cannot promise throughput for unknown operator hardware,
but its conformance/load tools let the operator prove chosen targets. A result
applies only to the named versions, configuration, workload, and infrastructure;
it is neither an SLA nor a prediction for another installation.

## 5. Queue and Background Timeliness

Queue age is measured from durable transaction/outbox commit, not from eventual
consumer visibility.

| Priority / effect | p95 start | p99 start | Completion/hand-off target |
| --- | ---: | ---: | --- |
| P0 security: revocation, compromise, key emergency, deletion cancellation | 2 s | 10 s | Effect/reconciliation begins within 15 s |
| P1 audit/outbox publication | 2 s | 5 s | Independent sink within 30 s |
| P1 authentication email/SMS/push | 5 s | 15 s | Approved provider accepts within 30 s; delivery is provider SLI |
| P1 security/user notification | 10 s | 30 s | Provider accepts within 60 s |
| P2 webhooks/action post-events | 15 s | 60 s | First attempt within 2 min |
| P2 SCIM/directory lifecycle event | 30 s | 2 min | Normalized effect within 5 min |
| P3 export/import/privacy/deletion | 1 min | 5 min | Progress heartbeat at least every 5 min; operation-specific deadline |
| P4 archive/cleanup/analytics | 5 min | 30 min | Complete within scheduled policy window |

Priority cannot reorder dependent events unsafely. Per-tenant fairness and
reserved P0/P1 capacity prevent a bulk customer job from delaying security
effects. Retry backoff, provider rate limits, dead letters, and maintenance do
not hide queue age.

Alerts:

- warn when p95 or oldest age exceeds 50% of its target for ten minutes;
- page when p99/oldest exceeds its target for five minutes, any P0 exceeds 10
  seconds, outbox/audit publication stops, or dead-letter growth is unowned; and
- declare incident severity from the customer/security effect, not queue name.

## 6. Recovery Objectives

The following are hosted-service objectives. A self-hosted operator must define,
implement, test, and communicate its own RPO/RTO; using the software or a
reference topology does not inherit these objectives.

| Failure scope | RPO | RTO / service objective |
| --- | ---: | ---: |
| Single API/job instance | 0 committed data | Automatic drain/retry within 2 min |
| Cache/rate-limit node | 0 authoritative data | Correct degraded/shared fallback within 5 min; never fail open |
| Queue worker/consumer | 0 accepted jobs | Resume P0/P1 within 5 min; all priorities within 15 min |
| One availability zone/database node | 0 confirmed commits | T1/T2 restored within 15 min |
| EU primary database service failure | <= 1 min | T1/T2 within 30 min; full management/jobs within 60 min |
| EU regional disaster | <= 5 min | T0/T1/T2 within 2 h; T3/T4 within 4 h |
| Object/export store | <= 15 min metadata; backup schedule for objects | New objects within 60 min; retained object access within 4 h |
| Signing custody outage | 0 key metadata; no unsafe fallback | Verification continues; signing restored/rotated within 15 min |
| Complete hosted control/data disaster | <= 5 min database; <= 24 h cold archive | Core service within 4 h; full backlog/reconciliation within 24 h |

RPO measures acknowledged durable state. Transactional identity change plus
outbox/audit has RPO 0 within the committed database. External provider effects
with ambiguous outcomes use reconciliation and are not claimed as exactly-once.

Backups, replicas, recovery control, keys, audit, queues, objects, and failover
remain in approved EU locations. Quarterly restore and failover drills use
synthetic data; annual full disaster exercises verify order, deletion
tombstones, issuer/key identity, revocation, audit continuity, provider
reconciliation, and customer/status communication.

No RTO permits replacing a protected dependency with a weaker local/global
adapter or restoring a stale backup without replaying revocation/deletion state.

## 7. Incident Severity and Response Targets

| Severity | Examples | Acknowledge | Containment target | Communication |
| --- | --- | ---: | ---: | --- |
| SEV-0 Critical security/privacy | Active signing/root compromise, cross-tenant access, platform-admin takeover, widespread credential/secret exposure, destructive integrity loss | 5 min | Stop ongoing exposure/effect within 30 min | Security/legal/executive immediately; customer/status update within 30 min when safe |
| SEV-1 Critical availability/high security | T1/T2 widespread outage, regional failure, confirmed account takeover path, bulk personal-data risk, audit/revocation failure | 10 min | Material mitigation within 60 min | Status within 30 min and at least hourly |
| SEV-2 Major degradation | Partial tenant/feature/provider outage, SLO fast burn, queue delay, bounded disclosure/integrity issue | 30 min | Mitigation/workaround within 4 h | Affected customers/status within 60 min; every 2 h |
| SEV-3 Minor | Limited low-risk defect, slow burn, non-production/security hardening gap | 1 business day | Owned plan within 3 business days | Targeted communication as needed |

Targets measure response and containment, not a promise that full remediation or
investigation finishes by that time. Suspected security incidents are classified
at the higher plausible severity until evidence supports downgrade.

Incident command assigns incident commander, security/privacy/legal/operations
roles, evidence channel, scope, customer/status communication, regulator/
contractual timeline owner, and recovery criteria. Responders preserve audit and
personal-data minimization; they do not copy secrets/customer data into chat or
tickets.

Post-incident review starts within two business days for SEV-0/1 and five for
SEV-2. It records timeline, contributing controls/assumptions, customer/privacy
impact, detection gaps, threat-model changes, owned work, regression/exercise
evidence, and due dates. SEV-0/1 actions cannot be closed by narrative alone.

## 8. Vulnerability Remediation Targets

| Severity | Triage/acknowledge | Mitigate or fix production exposure | Complete durable fix/retest |
| --- | ---: | ---: | ---: |
| Critical | 4 h | 24 h | 72 h unless coordinated disclosure requires a documented shorter safe plan |
| High | 1 business day | 7 calendar days | 14 calendar days |
| Medium | 5 business days | 30 calendar days | 60 calendar days |
| Low | 10 business days | 90 calendar days or next planned release | 120 calendar days |

An actively exploited or broadly reachable finding is handled as an incident,
not only a backlog vulnerability. Exceptions require security owner, accountable
product owner, compensating control, monitoring, affected-version disclosure,
and expiry. Critical/high exceptions block GA and ordinary release.

## 9. Release and Operational Gates

Release evidence includes:

- availability/latency/capacity/queue dashboards and burn alerts;
- load, soak, multi-instance, termination, dependency, and overload results;
- database/object/key/queue backup, restore, failover, and regional disaster
  exercises;
- incident page/communication and security containment exercises;
- current dependency/runtime/provider/residency qualification;
- no unowned critical/high findings or expired exceptions; and
- Docker replica comparison using the same black-box workload.

An SLO miss creates owned remediation; repeated misses change capacity/design,
not the metric definition. Product launch cannot claim these targets from local
unit tests or a single happy-path benchmark.

## 10. Review Triggers

- Traffic, tenant distribution, endpoint mix, password policy, token lifetime,
  queue priority, or customer SLA changes materially.
- A runtime, database, queue, KMS, object, provider, region, or architecture
  changes.
- An incident, load test, restore, or failover misses a target.
- Error budget is exhausted twice in a quarter.
- Security/privacy obligations require faster detection, containment, deletion,
  notification, or recovery.
