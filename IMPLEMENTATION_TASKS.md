# Authentication Platform — Implementation Task Breakdown

## 1. Purpose

This document turns the [product and architecture overview](AUTH_SOLUTION_OVERVIEW.md) into an ordered, executable backlog. Market research remains in the separate [other providers feature overview](OTHER_PROVIDERS_FEATURE_OVERVIEW.md).

The default order is intentional: complete a task only after its listed dependencies are complete. Independent tasks can be worked on in parallel once their dependencies are satisfied.

## 2. How to Use This Backlog

### 2.1 Task Rules

- Each checkbox is intended to be one small, reviewable unit of work.
- A task should normally take no more than two focused engineering days.
- Split a task again before starting it if implementation proves larger than that.
- `Depends on: none` means the task can begin immediately.
- A task is not complete merely because its happy path works.
- Product changes discovered during implementation must be added to this backlog rather than hidden inside an unrelated task.
- Architecture decisions must be recorded as short Architecture Decision Records under `docs/decisions/`.

### 2.2 Commit Workflow

Development is committed continuously rather than organised around pull requests.

- Create a commit after each completed task whenever the repository can pass the checks relevant to that task.
- Prefer one task per commit. Closely related tasks may share a commit only when they cannot form independently valid changes; list every included task ID in the message.
- Do not wait until the end of a phase or milestone to commit completed work.
- Do not create work-in-progress commits merely to mark activity. A commit should leave the repository coherent, buildable, and tested for its scope.
- Include the implementation, tests, generated artifacts that belong in source control, documentation, ADRs, and completed task checkbox in the same commit.
- Use concise commit messages in the form `<type>(<area>): <summary> [TASK-ID]`, for example `feat(runtime): add clock contract [RUN-002]`.
- Suitable commit types include `feat`, `fix`, `test`, `docs`, `refactor`, `build`, `ci`, and `chore`.
- Never mix unrelated pre-existing or user-authored changes into a task commit.
- Run the task's focused tests and applicable quality checks before committing. Run the complete clean-checkout quality suite at every milestone boundary.
- A failing intermediate state may exist in the working tree while a task is being developed, but it must not be committed as a completed task.
- Every bug-fix commit includes its regression test.
- Do not rewrite, squash, amend, or force-push existing shared history unless explicitly instructed.

### 2.3 Definition of Done for Every Task

Unless a task explicitly concerns documentation only, it is complete when:

- The intended behaviour and failure behaviour are implemented.
- Automated tests would fail if the behaviour were removed.
- Relevant unit, type, schema, contract, repository, component, integration, security, migration, concurrency, or end-to-end tests pass.
- Tenant-isolation tests use at least two tenants where tenant data is involved.
- External inputs are runtime-validated and unsafe outputs are redacted.
- OpenAPI and user or operator documentation are updated where relevant.
- Both Workers and Docker targets pass where runtime behaviour is affected.
- Executable first-party TypeScript retains 100% line, statement, function, and branch coverage.
- No applicable first-party file exceeds 250 physical lines.
- No focused, skipped, flaky, quarantined, or nondeterministic test is introduced.
- Formatting, linting, strict type checking, package-boundary checks, and production builds pass.

Documentation is exempt from the 250-line limit. Generated files, generated migrations, third-party code, lockfiles, and machine-generated fixtures use the exemptions defined in the architecture overview.

### 2.4 Adapter and Self-Hosting Rule

Infrastructure choices are replaceable implementation details, not domain dependencies.

- Core domain, use-case, route, and job code can depend only on runtime-neutral contracts.
- Queue, object storage, cache and rate-limit state, secrets, key management, email, SMS, observability, webhooks, DNS automation, certificate automation, and similar external capabilities must use adapters.
- Tenant-configurable **provider integrations** and operator-configured **infrastructure adapters** are separate concepts. A customer administrator may select an allowed email provider, but only a platform or self-hosted operator can select the queue or object-storage implementation.
- Every adapter declares its capabilities, supported runtimes, configuration schema, secret schema, health behaviour, failure policy, and residency characteristics.
- Adapters are selected and assembled at a deployment composition root. Core packages must not contain conditionals for a named infrastructure provider.
- Each required capability must have a safe local-development implementation, at least one production-capable self-hosted implementation, and an appropriate hosted implementation before those deployment profiles are declared supported.
- A deployment must fail validation when a required adapter is absent, incompatible with its runtime, incorrectly configured, or unable to meet the selected residency policy.
- All implementations of a contract run the same conformance suite, including failure, retry, duplicate-delivery, concurrency, redaction, tenant-scope, runtime, and residency cases that apply to that capability.

### 2.5 Delivery Milestones

| Milestone | Result |
| --- | --- |
| **M0 — Engineering foundation** | The monorepo, quality gates, contracts, runtime abstractions, database foundations, and deployment shells work. |
| **M1 — Core authentication MVP** | An organisation can create applications; users can sign up, consent, sign in, manage sessions, and use standards-based authorization through hosted screens. |
| **M2 — Production beta** | Stronger authenticators, provider management, webhooks, abuse protection, operational tooling, and production deployment paths are ready for controlled use. |
| **M3 — Enterprise identity** | End-user organisations, enterprise SSO, SCIM, advanced roles, support access, and self-service enterprise administration work. |
| **M4 — General availability and maturity** | Hosted and self-hosted operations, GDPR workflows, scaling, recovery, billing, SDKs, advanced security, and independent assurance are complete. |

## 3. Phase 0 — Decisions, Threat Model, and Product Rules

These tasks prevent foundational security or compatibility decisions from being made accidentally inside feature work.

- [x] **DEC-001 — Create the decision-record template and index.**

  **Depends on:** none.

  **Done when:** `docs/decisions/` contains a numbered template covering context, decision, alternatives, security impact, portability impact, and consequences.

- [x] **DEC-002 — Select and pin the workspace package manager.**

  **Depends on:** DEC-001.

  **Done when:** an ADR records the choice, version pinning, workspace layout, lockfile policy, and CI installation command. Start by evaluating the recommended `pnpm` option.

- [x] **DEC-003 — Define supported Node.js, browser, Workers, and TypeScript versions.**

  **Depends on:** DEC-001.

  **Done when:** minimum versions, upgrade cadence, and compatibility test matrix are recorded.

- [x] **DEC-004 — Select the TypeScript test toolchain.**

  **Depends on:** DEC-003.

  **Done when:** unit, type, component, end-to-end, coverage, and Workers-runtime test tools are selected; start by evaluating Vitest and Playwright.

- [x] **DEC-005 — Validate the Hono contract approach.**
  **Depends on:** DEC-003.  
  **Done when:** a spike proves Zod-based Hono routes can generate complete OpenAPI, run on Workers and Node, and produce usable inferred client types.

- [x] **DEC-006 — Select reviewed OAuth 2.0 and OpenID Connect building blocks.**
  **Depends on:** DEC-003.  
  **Done when:** an ADR identifies which protocol behaviours use reviewed libraries, which must be implemented locally, compatibility risks, and the conformance strategy.

- [x] **DEC-007 — Select the password-hashing implementations.**
  **Depends on:** DEC-003.  
  **Done when:** compatible Workers and Node implementations, Argon2id parameters, hash versioning, rehash rules, test vectors, and latency limits are recorded.

- [x] **DEC-008 — Define signing-key custody and rotation.**
  **Depends on:** DEC-006.  
  **Done when:** algorithms, key identifiers, publishing, overlap, retirement, emergency rotation, local development, hosted custody, and self-hosted custody are specified.

- [x] **DEC-009 — Define browser cookie and domain topology.**
  **Depends on:** DEC-006.  
  **Done when:** hosted and custom domains, cookie scope, `SameSite`, CSRF strategy, redirect boundaries, embedded-flow limitations, and account-domain behaviour are specified.

- [x] **DEC-010 — Choose identifier and timestamp conventions.**
  **Depends on:** DEC-001.  
  **Done when:** sortable identifiers such as UUIDv7, public identifier exposure, clock precision, UTC handling, and database representation are fixed.

- [ ] **DEC-011 — Define API versioning and compatibility policy.**  
  **Depends on:** DEC-005.  
  **Done when:** the initial `/v1` convention, deprecation headers, breaking-change rules, OpenAPI release process, and SDK compatibility promises are documented.

- [ ] **DEC-012 — Define shared API conventions.**  
  **Depends on:** DEC-011.  
  **Done when:** error envelopes, pagination, filtering, sorting, correlation identifiers, idempotency keys, optimistic concurrency, and rate-limit headers are specified.

- [ ] **DEC-013 — Define trusted tenant-context resolution.**  
  **Depends on:** DEC-012.  
  **Done when:** management organisation, customer organisation, application, and end-user organisation context sources and verification rules are documented.

- [ ] **DEC-014 — Decide the physical management-identity storage model.**  
  **Depends on:** DEC-013.  
  **Done when:** separate or shared physical tables are chosen without weakening the separate management and end-user trust boundaries.

- [ ] **DEC-015 — Define environment isolation.**  
  **Depends on:** DEC-013.  
  **Done when:** development, staging, and production data, credentials, keys, users, callbacks, and promotion boundaries are specified.

- [ ] **DEC-016 — Produce the first platform threat model.**  
  **Depends on:** DEC-006, DEC-008, DEC-009, DEC-013.  
  **Done when:** assets, actors, trust boundaries, abuse cases, mitigations, and residual risks cover authentication, tenancy, providers, support access, jobs, and both runtimes.

- [ ] **DEC-017 — Classify platform data.**  
  **Depends on:** DEC-016.  
  **Done when:** public, internal, confidential, credential, secret, and personal-data classes have storage, logging, encryption, retention, and export rules.

- [ ] **DEC-018 — Map European data-residency boundaries.**  
  **Depends on:** DEC-017.  
  **Done when:** databases, replicas, backups, logs, queues, scheduled jobs, object storage, support tools, and subprocessors have an approved European processing rule.

- [ ] **DEC-019 — Define bootstrap and break-glass policy.**  
  **Depends on:** DEC-016.  
  **Done when:** first installation, first platform administrator, credential custody, recovery, approvals, expiry, and mandatory audit procedures are documented.

- [ ] **DEC-020 — Define support and impersonation policy.**  
  **Depends on:** DEC-016, DEC-017.  
  **Done when:** eligibility, prohibited targets and actions, approval modes, notification, retention, and default-disabled behaviour are fixed.

- [ ] **DEC-021 — Define security and reliability targets.**  
  **Depends on:** DEC-016.  
  **Done when:** authentication latency, availability, recovery objectives, token endpoint capacity, acceptable queue delay, and incident severity targets are measurable.

- [ ] **DEC-022 — Create a protocol and security standards register.**  
  **Depends on:** DEC-006, DEC-016.  
  **Done when:** relevant OAuth, OIDC, JWT, PKCE, token exchange, WebAuthn, SAML, SCIM, webhook, password, and browser-security standards have pinned references and review owners.

## 4. Phase 1 — Monorepo and Quality Foundation

- [x] **FND-001 — Initialise the workspace root.**

  **Depends on:** DEC-002, DEC-003.

  **Done when:** the root manifest, workspace definition, lockfile, engines, package-manager pin, and root commands install reproducibly.

- [ ] **FND-002 — Create the initial Turborepo directory structure.**  
  **Depends on:** FND-001.  
  **Done when:** all planned `apps/`, `packages/`, `deploy/`, and `tooling/` workspaces exist with clear ownership and no placeholder production logic.

- [ ] **FND-003 — Add strict shared TypeScript configurations.**  
  **Depends on:** FND-002.  
  **Done when:** base, library, Node, Workers, React, and tooling configurations enable every strictness rule required by the architecture.

- [ ] **FND-004 — Add repository formatting.**  
  **Depends on:** FND-001.  
  **Done when:** one command checks formatting, another applies it, generated paths are centralised, and CI can run the check without mutation.

- [ ] **FND-005 — Add shared lint rules.**  
  **Depends on:** FND-003.  
  **Done when:** unsafe `any`, unhandled promises, unvalidated boundary data, prohibited assertions, secret logging, and focused tests are rejected where technically detectable.

- [ ] **FND-006 — Implement the 250-line policy checker in TypeScript.**  
  **Depends on:** FND-003.  
  **Done when:** tracked first-party code, tests, configuration, migrations, and tooling are counted physically; only centrally declared exemptions apply; checker tests cover every exemption and failure mode.

- [ ] **FND-007 — Implement package-boundary and cycle checks.**  
  **Depends on:** FND-002, FND-003.  
  **Done when:** application-to-package direction, runtime-neutrality, API/data separation, public exports, deep imports, and workspace cycles are enforced.

- [ ] **FND-008 — Configure unit and schema testing.**  
  **Depends on:** DEC-004, FND-003.  
  **Done when:** deterministic TypeScript tests, controlled clock/random helpers, coverage output, and per-package defaults work.

- [ ] **FND-009 — Configure compile-time type tests.**  
  **Depends on:** DEC-004, FND-003.  
  **Done when:** exported contracts can assert valid inference and expected compile failures.

- [ ] **FND-010 — Configure React component testing.**  
  **Depends on:** DEC-004, FND-003.  
  **Done when:** DOM behaviour, keyboard use, accessibility, loading, empty, success, and error states can be tested.

- [ ] **FND-011 — Configure end-to-end browser testing.**  
  **Depends on:** DEC-004, FND-002.  
  **Done when:** isolated test data, browser projects, trace capture, accessibility checks, and deterministic local startup work.

- [ ] **FND-012 — Enforce complete executable-code coverage.**  
  **Depends on:** FND-008, FND-010.  
  **Done when:** 100% line, statement, function, and branch thresholds fail locally and in CI, with only generated and third-party paths excluded.

- [ ] **FND-013 — Create shared test builders and redacted fixtures.**  
  **Depends on:** FND-008, DEC-017.  
  **Done when:** tenants, applications, users, sessions, time, identifiers, secrets, and provider outcomes can be created without real personal data.

- [ ] **FND-014 — Define the Turborepo task graph.**  
  **Depends on:** FND-002, FND-004, FND-005, FND-008.  
  **Done when:** every build, quality, test, contract, SDK, database, development, and deployment task from the architecture has correct inputs, outputs, caching, and dependencies.

- [ ] **FND-015 — Add affected-package CI.**  
  **Depends on:** FND-014.  
  **Done when:** ordinary changes run the smallest safe graph and changes to shared security, contracts, runtime, or database packages trigger all required downstream checks.

- [ ] **FND-016 — Add a full clean-checkout CI job.**  
  **Depends on:** FND-015.  
  **Done when:** install, generation, lint, typecheck, all tests, all builds, and reproducibility checks pass without undeclared local files.

- [ ] **FND-017 — Add dependency and credential scanning.**  
  **Depends on:** FND-015.  
  **Done when:** vulnerable dependencies, committed secrets, suspicious generated artifacts, and disallowed licences produce reviewable CI failures.

- [ ] **FND-018 — Add a TypeScript workspace generator.**  
  **Depends on:** FND-002, FND-003, FND-006, FND-014.  
  **Done when:** new libraries, applications, providers, and routes are generated with tests, public exports, correct tasks, and policy-compliant file sizes.

- [ ] **FND-019 — Add release and changelog conventions.**  
  **Depends on:** FND-001, DEC-011.  
  **Done when:** package versions, application releases, OpenAPI versions, migration notes, and security advisories have an explicit workflow.

- [ ] **FND-020 — Add contributor documentation.**  
  **Depends on:** FND-014, FND-016.  
  **Done when:** setup, commands, architecture boundaries, testing expectations, file-size policy, and review requirements are reproducible by a new contributor.

## 5. Phase 2 — Runtime-Neutral Platform Contracts

- [ ] **RUN-001 — Create the validated configuration package.**  
  **Depends on:** DEC-005, FND-003, FND-008.  
  **Done when:** configuration schemas distinguish public values, secrets, build-time values, and runtime bindings; invalid startup configuration fails safely.

- [ ] **RUN-002 — Create `Clock`, `RandomSource`, and identifier contracts.**  
  **Depends on:** DEC-010, FND-008.  
  **Done when:** production and deterministic test implementations pass shared contract tests.

- [ ] **RUN-003 — Create cryptography and password-hasher contracts.**  
  **Depends on:** DEC-007, DEC-008, RUN-002.  
  **Done when:** hashing, verification, random bytes, signing, verification, encryption, and key metadata are explicit capabilities with test vectors.

- [ ] **RUN-004 — Create secret-storage contracts.**  
  **Depends on:** DEC-017, RUN-002.  
  **Done when:** write-only secret creation, version lookup, rotation metadata, disablement, and redacted errors are represented.

- [ ] **RUN-005 — Create key-management contracts.**  
  **Depends on:** DEC-008, RUN-003, RUN-004.  
  **Done when:** sign, verify, wrap, unwrap, rotate, retire, and publish-safe-metadata operations are covered by conformance tests.

- [ ] **RUN-006 — Create cache and rate-limit-state contracts.**  
  **Depends on:** DEC-013, RUN-002.  
  **Done when:** tenant-scoped keys, expiry, atomic increment, compare-and-set, deletion, health, and explicit failure policy are modelled.

- [ ] **RUN-007 — Create durable queue contracts.**  
  **Depends on:** RUN-002.  
  **Done when:** publish, consume, delay, lease, retry, dead-letter, acknowledgement, and idempotency metadata are modelled.

- [ ] **RUN-008 — Create object-storage contracts.**  
  **Depends on:** DEC-017, DEC-018.  
  **Done when:** put, get, delete, retention, checksums, signed access, classification, and residency metadata are modelled.

- [ ] **RUN-009 — Create observability contracts.**  
  **Depends on:** DEC-017.  
  **Done when:** structured logs, metrics, traces, correlation, audit separation, personal-data redaction, and secret suppression are defined.

- [ ] **RUN-010 — Create request and actor context.**  
  **Depends on:** DEC-013, RUN-002, RUN-009.  
  **Done when:** correlation, actor, subject, tenant, application, active organisation, assurance level, network metadata, and impersonation state are request-scoped.

- [ ] **RUN-011 — Create runtime capability manifests.**  
  **Depends on:** RUN-003 through RUN-009.  
  **Done when:** startup can prove that each deployment supplies every required capability and can reject incompatible adapters.

- [ ] **RUN-012 — Create dependency composition roots.**  
  **Depends on:** RUN-011.  
  **Done when:** domain and route code receives explicit interfaces and contains no Node, Workers, filesystem, process, or platform imports.

- [ ] **RUN-013 — Implement local deterministic adapters.**  
  **Depends on:** RUN-002 through RUN-009.  
  **Done when:** safe in-memory request/test doubles and local non-production adapters pass contracts and cannot be enabled in production.

- [ ] **RUN-014 — Add liveness, readiness, and dependency diagnostics contracts.**  
  **Depends on:** RUN-011, DEC-021.  
  **Done when:** liveness avoids dependency checks, readiness validates required dependencies and schema compatibility, and diagnostics are access controlled.

- [ ] **RUN-015 — Prove runtime neutrality automatically.**  
  **Depends on:** RUN-012, FND-007.  
  **Done when:** CI rejects runtime-specific imports and builds runtime-neutral packages against both Workers and Node type environments.

- [ ] **RUN-016 — Define infrastructure-adapter packaging rules.**  
  **Depends on:** RUN-011, FND-007.  
  **Done when:** queue, cache, object-storage, secret, key-management, observability, DNS, certificate, and deployment adapters live in separate packages with explicit public exports and runtime support.

- [ ] **RUN-017 — Implement operator-controlled adapter selection.**  
  **Depends on:** RUN-001, RUN-011, RUN-016.  
  **Done when:** hosted and self-hosted composition roots select adapters through validated operator configuration, while customer APIs cannot replace platform infrastructure.

- [ ] **RUN-018 — Create infrastructure-adapter conformance harnesses.**  
  **Depends on:** RUN-003 through RUN-009, RUN-016.  
  **Done when:** every infrastructure contract has reusable success, failure, timeout, retry, concurrency, redaction, runtime, health, and residency tests appropriate to that capability.

- [ ] **RUN-019 — Create managed-domain automation contracts.**  
  **Depends on:** RUN-002, RUN-004, RUN-008, RUN-016.  
  **Done when:** DNS verification, certificate lifecycle, and frontend deployment are operator adapters rather than hosted-provider logic embedded in the domain.

- [ ] **RUN-020 — Enforce the no-cross-request-process-state rule.**  
  **Depends on:** RUN-012, RUN-016, FND-007.  
  **Done when:** automated architecture checks and multi-instance tests reject tenant caches, sessions, nonces, locks, rate limits, job ownership, or authorization state held only in application memory.

## 6. Phase 3 — Database, Migrations, and Repositories

- [ ] **DB-001 — Create database-neutral repository primitives.**  
  **Depends on:** DEC-010, DEC-013, RUN-002.  
  **Done when:** pagination, optimistic versions, tenant scope, atomic consume, and not-found/conflict errors have typed contracts.

- [ ] **DB-002 — Define `UnitOfWork` and transaction semantics.**  
  **Depends on:** DB-001.  
  **Done when:** atomic use cases and post-commit event recording can be expressed without importing Drizzle.

- [ ] **DB-003 — Create the shared repository conformance harness.**  
  **Depends on:** DB-001, DB-002, FND-013.  
  **Done when:** a dialect implementation can run the same CRUD, conflict, transaction, pagination, isolation, and concurrency scenarios.

- [ ] **DB-004 — Create SQLite Drizzle configuration and migration runner.**  
  **Depends on:** FND-003, DB-002.  
  **Done when:** an empty local SQLite database can be created, migrated, inspected for drift, and destroyed by isolated tests.

- [ ] **DB-005 — Create PostgreSQL Drizzle configuration and migration runner.**  
  **Depends on:** FND-003, DB-002.  
  **Done when:** an empty disposable PostgreSQL database can be migrated and checked for drift in CI.

- [ ] **DB-006 — Define platform and customer-organisation schemas.**  
  **Depends on:** DEC-014, DB-004, DB-005.  
  **Done when:** platform installation state, protected system organisation, customer organisations, environments, timestamps, versions, and deletion rules exist in both dialects.

- [ ] **DB-007 — Define management-identity and admin-membership schemas.**  
  **Depends on:** DEC-014, DB-006.  
  **Done when:** one management identity can belong to many customer organisations with independent roles and status.

- [ ] **DB-008 — Define application and client schemas.**  
  **Depends on:** DB-006.  
  **Done when:** application types, clients, redirect/logout URLs, origins, scopes, token policy, environment, and secret metadata are represented.

- [ ] **DB-009 — Define user, identity, and credential schemas.**  
  **Depends on:** DB-006, DEC-007.  
  **Done when:** users, verified addresses, passwords, external identities, authenticators, status, metadata visibility, and uniqueness rules are represented per customer organisation.

- [ ] **DB-010 — Define session, token-family, and one-time-token schemas.**  
  **Depends on:** DB-009.  
  **Done when:** sessions, devices, refresh families, authorization codes, verification, recovery, nonce, replay, expiry, revocation, and atomic consumption can be stored.

- [ ] **DB-011 — Define consent and application-grant schemas.**  
  **Depends on:** DB-008, DB-009.  
  **Done when:** requested scopes, accepted scopes, original sign-up application, consent version, grant, denial, and revocation history are represented.

- [ ] **DB-012 — Define roles, permissions, and policy schemas.**  
  **Depends on:** DB-006, DB-008.  
  **Done when:** customer defaults, application roles and overrides, permission assignment, and versioned policy settings are represented.

- [ ] **DB-013 — Define provider definition, instance, secret, and binding schemas.**  
  **Depends on:** DB-006, DB-008, RUN-004.  
  **Done when:** adapter versions, capabilities, redacted configuration, secret references, scope, purpose, priority, fallback, health, and disablement are represented.

- [ ] **DB-014 — Define audit, outbox, webhook, and job schemas.**  
  **Depends on:** DB-006, RUN-007.  
  **Done when:** immutable audit records, durable events, delivery attempts, leases, retries, checkpoints, and dead letters are represented.

- [ ] **DB-015 — Implement platform and organisation repositories.**  
  **Depends on:** DB-003, DB-006.  
  **Done when:** SQLite and PostgreSQL implementations pass the shared suite, including protected-system-organisation invariants and cross-tenant denial.

- [ ] **DB-016 — Implement management and application repositories.**  
  **Depends on:** DB-003, DB-007, DB-008.  
  **Done when:** both dialects pass membership, role, environment, callback, origin, client-secret, conflict, and tenant-isolation tests.

- [ ] **DB-017 — Implement user and credential repositories.**  
  **Depends on:** DB-003, DB-009.  
  **Done when:** both dialects pass identity uniqueness, normalized lookup, credential versioning, status, metadata, and tenant-isolation tests.

- [ ] **DB-018 — Implement session and token repositories.**  
  **Depends on:** DB-003, DB-010.  
  **Done when:** both dialects pass atomic consume, refresh-family rotation, reuse, expiry, revocation, race, and tenant-isolation tests.

- [ ] **DB-019 — Implement consent and authorization repositories.**  
  **Depends on:** DB-003, DB-011, DB-012.  
  **Done when:** both dialects pass grant, scope, revocation, role override, stale version, and cross-application tests.

- [ ] **DB-020 — Implement provider repositories.**  
  **Depends on:** DB-003, DB-013.  
  **Done when:** both dialects pass binding precedence, secret metadata, rotation, health, disablement, and tenant-isolation tests.

- [ ] **DB-021 — Implement audit, outbox, webhook, and job repositories.**  
  **Depends on:** DB-003, DB-014.  
  **Done when:** both dialects pass immutability, transactional publication, competing lease, duplicate delivery, retry, and dead-letter tests.

- [ ] **DB-022 — Add migration-from-zero CI.**  
  **Depends on:** DB-006 through DB-014.  
  **Done when:** every SQLite and PostgreSQL migration applies from an empty database and schema drift fails CI.

- [ ] **DB-023 — Add representative upgrade migration tests.**  
  **Depends on:** DB-022.  
  **Done when:** retained previous-release fixtures upgrade without data loss and forward-recovery is documented.

- [ ] **DB-024 — Add destructive-migration safeguards.**  
  **Depends on:** DB-022.  
  **Done when:** destructive SQL or schema changes require an explicit expand-and-contract plan and cannot run as an ordinary application startup side effect.

- [ ] **DB-025 — Add the local Workers D1/SQLite-compatible database adapter.**  
  **Depends on:** DB-004, DB-015 through DB-021, RUN-017.  
  **Done when:** local Workers development runs the shared repository conformance suite through the D1-compatible binding without making D1 a required hosted-production database.

## 7. Phase 4 — API Contracts and Deployable Shells

- [ ] **API-001 — Create shared schema primitives.**  
  **Depends on:** DEC-005, DEC-010, DEC-012.  
  **Done when:** identifiers, timestamps, URLs, emails, phones, scopes, names, metadata, and redacted-secret schemas have valid, invalid, and boundary tests.

- [ ] **API-002 — Create the shared error catalogue.**  
  **Depends on:** API-001.  
  **Done when:** stable error codes map to HTTP status, safe message, correlation identifier, field errors, retry metadata, and OpenAPI schemas.

- [ ] **API-003 — Create pagination, filtering, sorting, and concurrency contracts.**  
  **Depends on:** API-001, DEC-012.  
  **Done when:** cursor handling, bounded page sizes, allow-listed sort/filter fields, ETags or versions, and conflict responses are reusable.

- [ ] **API-004 — Create authentication and permission metadata for routes.**  
  **Depends on:** DEC-013, API-002.  
  **Done when:** public, end-user, management, platform, client, scope, role, and permission requirements are declared in route contracts.

- [ ] **API-005 — Create a standard contract-first route builder.**  
  **Depends on:** DEC-005, API-002 through API-004.  
  **Done when:** unique operation IDs, input validation, typed results, errors, examples, security, and lifecycle metadata are mandatory.

- [ ] **API-006 — Add common Hono middleware.**  
  **Depends on:** RUN-010, API-005.  
  **Done when:** correlation, structured logging, error mapping, body limits, secure headers, CORS, request timing, and content negotiation are tested.

- [ ] **API-007 — Create the Authentication API shell.**  
  **Depends on:** RUN-012, API-006.  
  **Done when:** `/v1`, liveness, readiness, a placeholder version endpoint, and runtime-neutral composition build without feature routes.

- [ ] **API-008 — Create the Management API shell.**  
  **Depends on:** RUN-012, API-006.  
  **Done when:** management routes have a separate OpenAPI document and explicit management authorization boundary.

- [ ] **API-009 — Create the Platform API shell.**  
  **Depends on:** RUN-012, API-006.  
  **Done when:** platform routes are isolated, unavailable through ordinary customer authorization, and their docs can be protected.

- [ ] **API-010 — Generate versioned OpenAPI documents.**  
  **Depends on:** API-007 through API-009.  
  **Done when:** clean generation produces stable Authentication, End-User, Management, and Platform specifications with no hand-maintained duplicate schemas.

- [ ] **API-011 — Expose OpenAPI and interactive documentation.**  
  **Depends on:** API-010.  
  **Done when:** each appropriate API serves `/openapi.json` and `/docs`; platform documentation is access controlled.

- [ ] **API-012 — Add OpenAPI validation and linting.**  
  **Depends on:** API-010.  
  **Done when:** malformed documents, duplicate operation IDs, incomplete errors, missing security, unsafe examples, and missing descriptions fail CI.

- [ ] **API-013 — Add OpenAPI breaking-change detection.**  
  **Depends on:** DEC-011, API-010.  
  **Done when:** CI compares with the released specification and requires an explicit versioning or deprecation decision.

- [ ] **API-014 — Add response contract verification.**  
  **Depends on:** API-010.  
  **Done when:** undocumented routes, statuses, content types, headers, and schema-invalid responses fail against both runtimes.

- [ ] **API-015 — Generate and compile the first TypeScript client.**  
  **Depends on:** API-010.  
  **Done when:** a first-party client is generated from the released contract and example consumers compile without server-package imports.

- [ ] **API-016 — Add the Node/Docker Hono entry points.**  
  **Depends on:** API-007 through API-009, RUN-012.  
  **Done when:** the same application routes run through the Node server adapter with graceful shutdown.

- [ ] **API-017 — Add the Cloudflare Workers Hono entry points.**  
  **Depends on:** API-007 through API-009, RUN-012.  
  **Done when:** the same application routes run through Workers-compatible bindings with no Node-only bundle content.

- [ ] **API-018 — Add Docker and Workers smoke suites.**  
  **Depends on:** API-016, API-017.  
  **Done when:** health, validation, errors, OpenAPI, security headers, and runtime capability failures behave equivalently.

- [ ] **API-019 — Implement distributed idempotency middleware.**  
  **Depends on:** DB-002, API-003, API-006.  
  **Done when:** retryable mutations store tenant-scoped request hashes and responses, reject key reuse with different input, and pass race tests.

## 8. Phase 5 — Platform Bootstrap, Tenancy, and Applications

- [ ] **TEN-001 — Implement protected system-organisation creation.**  
  **Depends on:** DB-015, DB-021, DEC-019.  
  **Done when:** installation creates exactly one protected organisation transactionally and repeated bootstrap is harmless.

- [ ] **TEN-002 — Enforce system-organisation invariants.**  
  **Depends on:** TEN-001.  
  **Done when:** normal APIs cannot list, delete, transfer, disable, or convert it; database and domain tests cover bypass attempts.

- [ ] **TEN-003 — Register the management application during bootstrap.**  
  **Depends on:** TEN-001, DB-016.  
  **Done when:** installation creates a first-party management application with explicit environment and secure callback/origin settings.

- [ ] **TEN-004 — Implement the one-time first-platform-admin command.**  
  **Depends on:** TEN-001, DB-016, DEC-019, RUN-003.  
  **Done when:** creation is single use, expires, avoids command-line secret leakage, produces audit events, and cannot create a customer admin accidentally.

- [ ] **TEN-005 — Implement emergency platform recovery.**  
  **Depends on:** TEN-004.  
  **Done when:** the break-glass workflow requires the documented controls, expires promptly, cannot become an ordinary login path, and is fully audited.

- [ ] **TEN-006 — Implement customer-organisation creation.**  
  **Depends on:** DB-015, API-019.  
  **Done when:** a management identity can create a tenant and owner membership atomically with defaults and an audit event.

- [ ] **TEN-007 — Implement customer-organisation read and update.**  
  **Depends on:** TEN-006, API-003.  
  **Done when:** authorized members can read or update allowed settings using optimistic concurrency and other tenants cannot observe existence.

- [ ] **TEN-008 — Implement customer-organisation suspension and deletion states.**  
  **Depends on:** TEN-007, DEC-017.  
  **Done when:** suspend, scheduled deletion, cancellation, retention, anonymisation, and protected-system exclusions are explicit state transitions.

- [ ] **TEN-009 — Implement management roles and permissions.**  
  **Depends on:** TEN-006, DB-012.  
  **Done when:** owner, administrator, developer, support, viewer, and dedicated sensitive permissions are policy evaluated rather than global flags.

- [ ] **TEN-010 — Implement administrator invitations.**  
  **Depends on:** TEN-009, DB-016, DB-021.  
  **Done when:** invitations are single use, expiring, revocable, email-delivery-ready, and safe under duplicate acceptance.

- [ ] **TEN-011 — Implement administrator membership management.**  
  **Depends on:** TEN-009, TEN-010.  
  **Done when:** roles can change, memberships can be removed, the last owner is protected, and every change is audited.

- [ ] **TEN-012 — Implement active management-organisation switching.**  
  **Depends on:** TEN-011, DEC-013.  
  **Done when:** a management identity can list its organisations, select one, and have membership revalidated on every request without merging permissions.

- [ ] **TEN-013 — Implement environment creation and isolation.**  
  **Depends on:** TEN-006, DEC-015.  
  **Done when:** development, staging, and production have isolated credentials, applications, provider bindings, test users, and promotion metadata.

- [ ] **TEN-014 — Implement application creation and application types.**  
  **Depends on:** TEN-006, TEN-013, DB-016.  
  **Done when:** web, SPA, native, API, machine, and device applications receive suitable defaults and stable client identifiers.

- [ ] **TEN-015 — Implement application settings.**  
  **Depends on:** TEN-014.  
  **Done when:** names, status, authentication methods, token lifetimes, scopes, branding references, and policy overrides use concurrency control.

- [ ] **TEN-016 — Implement redirect, logout, and origin management.**  
  **Depends on:** TEN-014, DEC-009.  
  **Done when:** URL canonicalisation, exact matching, local-development exceptions, wildcard prohibition or limits, and malicious URL tests are complete.

- [ ] **TEN-017 — Implement confidential client-secret lifecycle.**  
  **Depends on:** TEN-014, RUN-003, RUN-004.  
  **Done when:** secrets are shown once, stored hashed or referenced, overlap during rotation, can be revoked, and never appear in logs or reads.

- [ ] **TEN-018 — Implement organisation and application policy inheritance.**  
  **Depends on:** TEN-007, TEN-015, DB-012.  
  **Done when:** effective settings resolve customer defaults plus explicit application overrides with explainable provenance.

- [ ] **TEN-019 — Implement tenant-scoped audit querying.**  
  **Depends on:** DB-021, TEN-009.  
  **Done when:** authorized administrators can page and filter redacted audit events without changing or crossing tenant scope.

- [ ] **TEN-020 — Add comprehensive tenant-isolation tests.**  
  **Depends on:** TEN-006 through TEN-019.  
  **Done when:** identifiers, alternate routes, filters, nested resources, active-context changes, and platform/customer boundaries resist cross-tenant access.

- [ ] **TEN-021 — Implement versioned branding and hosted-screen configuration.**  
  **Depends on:** TEN-015, RUN-008.  
  **Done when:** organisation defaults and application overrides cover logos, colours, typography, text, policy links, assets, locales, validation, preview versions, rollback, and tenant isolation.

## 9. Phase 6 — Core User Authentication and Account Lifecycle

- [ ] **AUTH-001 — Implement canonical email and phone value objects.**  
  **Depends on:** API-001, DB-017.  
  **Done when:** normalization, display preservation, uniqueness, international phone parsing, and edge cases are defined without unsafe assumptions.

- [ ] **AUTH-002 — Implement password hashing and verification adapters.**  
  **Depends on:** DEC-007, RUN-003.  
  **Done when:** Workers and Node produce compatible versioned hashes, share vectors, enforce resource limits, and trigger rehash when parameters change.

- [ ] **AUTH-003 — Implement user creation rules.**  
  **Depends on:** AUTH-001, DB-017, TEN-018.  
  **Done when:** open, invitation-only, allow-list, and administrator-created modes can enforce application and organisation policy.

- [ ] **AUTH-004 — Implement email/password sign-up.**  
  **Depends on:** AUTH-002, AUTH-003, API-019.  
  **Done when:** the user, password identity, original-application grant, verification request, audit event, and outbox event are created atomically.

- [ ] **AUTH-005 — Implement verification-token issuance.**  
  **Depends on:** DB-018, RUN-002, RUN-003.  
  **Done when:** tokens are random, stored safely, scoped, single use, expiring, rate limited, and replaceable without invalid state.

- [ ] **AUTH-006 — Implement email verification.**  
  **Depends on:** AUTH-004, AUTH-005.  
  **Done when:** valid tokens verify once, repeated requests are harmless, expired or cross-tenant tokens fail safely, and changes are audited.

- [ ] **AUTH-007 — Implement password sign-in decision logic.**  
  **Depends on:** AUTH-002, AUTH-006, TEN-018.  
  **Done when:** status, verification, password, policy, risk hook, application access, and enumeration-resistant errors are evaluated in a fixed safe order.

- [ ] **AUTH-008 — Implement browser session creation.**  
  **Depends on:** AUTH-007, DB-018, DEC-009.  
  **Done when:** a successful decision creates a shared durable session and secure cookie that survives instance changes.

- [ ] **AUTH-009 — Implement session authentication middleware.**  
  **Depends on:** AUTH-008, RUN-010.  
  **Done when:** expiry, revocation, subject status, tenant, assurance, active context, and impersonation state are checked consistently.

- [ ] **AUTH-010 — Implement logout.**  
  **Depends on:** AUTH-009.  
  **Done when:** the current session is revoked, cookies are safely cleared, repeat logout is harmless, and audit/event records are produced.

- [ ] **AUTH-011 — Implement refresh-token families.**  
  **Depends on:** DB-018, RUN-003.  
  **Done when:** opaque tokens rotate atomically, family ancestry is retained, tokens are audience/client bound, and plaintext tokens are never stored.

- [ ] **AUTH-012 — Implement refresh-token reuse detection.**  
  **Depends on:** AUTH-011.  
  **Done when:** concurrent and replayed use revokes the correct family and session, creates a security event, and cannot be bypassed across instances.

- [ ] **AUTH-013 — Implement session revocation services.**  
  **Depends on:** AUTH-009, AUTH-011.  
  **Done when:** current, selected, user-wide, application-wide, and tenant-wide revocation paths have explicit permissions and bounded execution.

- [ ] **AUTH-014 — Implement password-recovery requests.**  
  **Depends on:** AUTH-005, AUTH-007.  
  **Done when:** responses resist account enumeration, tokens invalidate older requests as configured, attempts are rate limited, and messages are queued.

- [ ] **AUTH-015 — Implement password reset.**  
  **Depends on:** AUTH-014.  
  **Done when:** a single-use recovery token changes the password, prevents reuse, applies session-revocation policy, and sends a security notification.

- [ ] **AUTH-016 — Implement signed-in password change.**  
  **Depends on:** AUTH-009, AUTH-002.  
  **Done when:** recent authentication or step-up is required, the current credential is checked, revocation policy applies, and the event is audited.

- [ ] **AUTH-017 — Implement email change with reverification.**  
  **Depends on:** AUTH-005, AUTH-009.  
  **Done when:** old and new addresses receive appropriate notices, uniqueness races are safe, recovery protection applies, and login changes only at the defined point.

- [ ] **AUTH-018 — Implement email OTP authentication.**  
  **Depends on:** AUTH-005, AUTH-008.  
  **Done when:** purpose-bound OTPs have safe entropy, attempt limits, single use, expiry, resend behaviour, and enumeration resistance.

- [ ] **AUTH-019 — Implement magic-link authentication.**  
  **Depends on:** AUTH-005, AUTH-008, DEC-009.  
  **Done when:** links are browser and purpose safe, single use, expiring, redirect constrained, and protected from common email-scanner consumption.

- [ ] **AUTH-020 — Implement first-application consent detection.**  
  **Depends on:** DB-019, AUTH-007.  
  **Done when:** original sign-up applications proceed under the recorded grant and first entry to another shared-pool application requires consent.

- [ ] **AUTH-021 — Implement consent grant and denial.**  
  **Depends on:** AUTH-020.  
  **Done when:** requested scopes, descriptions, accepted scopes, policy version, decision, and time are stored; denial returns a standards-compatible result.

- [ ] **AUTH-022 — Implement grant review and revocation.**  
  **Depends on:** AUTH-021, AUTH-013.  
  **Done when:** users can list grants and revoke an application, causing the documented token/session effects without deleting the shared identity.

- [ ] **AUTH-023 — Implement user profile management.**  
  **Depends on:** AUTH-009, DB-017.  
  **Done when:** public, private, and server-only fields have explicit writable/readable rules, validation, concurrency, and audit behaviour.

- [ ] **AUTH-024 — Implement device and session inventory.**  
  **Depends on:** AUTH-009, AUTH-013.  
  **Done when:** users can see safe device/session metadata, identify the current session, and revoke another session.

- [ ] **AUTH-025 — Implement account suspension, lock, ban, and unblock.**  
  **Depends on:** AUTH-009, TEN-009.  
  **Done when:** states have distinct semantics, permissions, session effects, reason capture, notifications, and audit events.

- [ ] **AUTH-026 — Implement user export.**  
  **Depends on:** AUTH-023, RUN-008, DEC-017.  
  **Done when:** an authorized durable job creates a scoped, expiring, encrypted export and records access.

- [ ] **AUTH-027 — Implement user deletion and anonymisation.**  
  **Depends on:** AUTH-013, AUTH-023, DEC-017.  
  **Done when:** immediate access revocation, retention holds, delayed deletion, identifiers, audit preservation, and backup-expiry disclosure follow policy.

- [ ] **AUTH-028 — Implement administrator user search and basic lifecycle actions.**  
  **Depends on:** AUTH-023, AUTH-025, TEN-009.  
  **Done when:** scoped administrators can search bounded indexed fields and perform only permitted create, inspect, suspend, unblock, or delete actions.

- [ ] **AUTH-029 — Add core authentication race tests.**  
  **Depends on:** AUTH-004 through AUTH-028.  
  **Done when:** duplicate sign-up, verification, recovery, refresh, consent, deletion, and status changes remain correct across multiple API instances.

- [ ] **AUTH-030 — Implement phone-number change and reverification.**  
  **Depends on:** AUTH-001, AUTH-005, AUTH-009, ADV-001.  
  **Done when:** old/new number notifications, proof of control, uniqueness races, step-up, recovery protection, and session effects follow explicit policy.

## 10. Phase 7 — OAuth 2.0 and OpenID Connect

- [ ] **OIDC-001 — Create issuer and endpoint metadata services.**  
  **Depends on:** DEC-006, DEC-009, TEN-014.  
  **Done when:** issuer selection is canonical, tenant/application routing is unambiguous, and untrusted forwarding headers cannot alter security decisions.

- [ ] **OIDC-002 — Implement OpenID Connect discovery.**  
  **Depends on:** OIDC-001.  
  **Done when:** discovery accurately advertises implemented endpoints, grants, response modes, scopes, claims, authentication methods, and algorithms.

- [ ] **OIDC-003 — Implement signing-key loading and JWKS publication.**  
  **Depends on:** RUN-005, DEC-008, OIDC-001.  
  **Done when:** only public active/overlapping keys are published and cache headers, key IDs, rotation, and unavailable-key failures are tested.

- [ ] **OIDC-004 — Implement authorization-request parsing.**  
  **Depends on:** DEC-006, TEN-016, API-005.  
  **Done when:** client, redirect URI, response type, response mode, scope, state, nonce, prompt, login hint, and malformed inputs are strictly validated.

- [ ] **OIDC-005 — Implement PKCE validation.**  
  **Depends on:** OIDC-004.  
  **Done when:** secure challenge methods are required by application type and downgrade, reuse, malformed verifier, and timing behaviour are tested.

- [ ] **OIDC-006 — Implement authorization transaction persistence.**  
  **Depends on:** OIDC-004, DB-018.  
  **Done when:** browser navigation can resume safely across instances without storing request state only in process or trusting mutable query input.

- [ ] **OIDC-007 — Connect authentication and consent to authorization transactions.**  
  **Depends on:** OIDC-006, AUTH-009, AUTH-021.  
  **Done when:** login, prompt, existing session, consent, cancellation, and errors resume the exact validated transaction.

- [ ] **OIDC-008 — Implement one-time authorization codes.**  
  **Depends on:** OIDC-005, OIDC-007, DB-018.  
  **Done when:** codes are short lived, bound to client, redirect, subject, scopes, nonce, and PKCE; atomic exchange prevents replay.

- [ ] **OIDC-009 — Implement confidential-client authentication.**  
  **Depends on:** TEN-017, OIDC-001.  
  **Done when:** supported methods, constant-time secret verification, rotation overlap, public-client rejection, and safe errors are tested.

- [ ] **OIDC-010 — Implement the token endpoint framework.**  
  **Depends on:** OIDC-008, OIDC-009, API-005.  
  **Done when:** grant dispatch, client validation, content type, rate limits, standard errors, correlation, and audit hooks are common across grants.

- [ ] **OIDC-011 — Implement authorization-code exchange.**  
  **Depends on:** OIDC-008, OIDC-010, AUTH-011.  
  **Done when:** valid code exchange issues appropriate tokens once and all binding, expiry, replay, and client failures are standards compatible.

- [ ] **OIDC-012 — Implement access-token creation and validation.**  
  **Depends on:** OIDC-003, OIDC-011, TEN-018.  
  **Done when:** issuer, subject, audience, time, scopes, tenant, application, token ID, and minimal policy-controlled claims are validated.

- [ ] **OIDC-013 — Implement ID-token creation and validation.**  
  **Depends on:** OIDC-003, OIDC-011.  
  **Done when:** nonce, authentication time, assurance, authorised party, subject, issuer, audience, signing, and optional claims are correct.

- [ ] **OIDC-014 — Implement refresh-token grant.**  
  **Depends on:** OIDC-010, AUTH-011, AUTH-012.  
  **Done when:** rotation, family reuse, client/audience binding, scope narrowing, consent revocation, user status, and current policy are checked.

- [ ] **OIDC-015 — Implement UserInfo.**  
  **Depends on:** OIDC-012, AUTH-023.  
  **Done when:** only consented, scope-authorised, policy-allowed claims are returned for the validated subject and audience.

- [ ] **OIDC-016 — Implement token revocation.**  
  **Depends on:** OIDC-010, AUTH-013.  
  **Done when:** refresh and supported access tokens can be revoked without leaking token existence and repeat requests are safe.

- [ ] **OIDC-017 — Implement token introspection.**  
  **Depends on:** OIDC-012, OIDC-014.  
  **Done when:** authorized resource servers receive correct active state, metadata, revocation, expiry, audience, and minimal subject data.

- [ ] **OIDC-018 — Implement OIDC logout capabilities.**  
  **Depends on:** AUTH-010, OIDC-013, TEN-016.  
  **Done when:** local logout, post-logout redirect validation, state, session targeting, and repeat behaviour are safe.

- [ ] **OIDC-019 — Implement client-credentials grant.**  
  **Depends on:** OIDC-010, TEN-017, DB-019.  
  **Done when:** machine clients receive audience-bound scopes without a user subject and rotation, revocation, rate limits, and audit are covered.

- [ ] **OIDC-020 — Implement device-authorization requests.**  
  **Depends on:** OIDC-010, DB-018.  
  **Done when:** device and user codes have appropriate entropy, lifetime, display format, verification URI, rate limits, and tenant/client binding.

- [ ] **OIDC-021 — Implement device verification and polling.**  
  **Depends on:** OIDC-020, AUTH-021.  
  **Done when:** approval, denial, expiry, slow-down, consent, duplicate polling, and successful single exchange behave correctly.

- [ ] **OIDC-022 — Implement token exchange.**  
  **Depends on:** OIDC-010, OIDC-012, DEC-020.  
  **Done when:** explicitly permitted delegation validates subject/actor tokens, audience, scopes, policy, actor claims, depth, expiry, and audit.

- [ ] **OIDC-023 — Implement token-claim policy evaluation.**  
  **Depends on:** TEN-018, OIDC-012, OIDC-013.  
  **Done when:** organisation defaults, application overrides, privacy limits, custom namespaced claims, token-size limits, and live-lookup alternatives are enforced.

- [ ] **OIDC-024 — Implement signing-key rotation.**  
  **Depends on:** OIDC-003, OIDC-012, OIDC-013.  
  **Done when:** new keys activate, old keys overlap until dependent tokens expire, JWKS updates safely, and rollback/emergency procedures are tested.

- [ ] **OIDC-025 — Add protocol conformance suites.**  
  **Depends on:** OIDC-002 through OIDC-024.  
  **Done when:** positive, negative, malformed, replay, mix-up, downgrade, redirect, PKCE, nonce, client, key-rotation, and error-response tests pass on Workers and Docker.

- [ ] **OIDC-026 — Document unsupported unsafe grants.**  
  **Depends on:** OIDC-002.  
  **Done when:** discovery and documentation do not advertise Implicit or Resource Owner Password Credentials and explain supported migration paths.

- [ ] **OIDC-027 — Implement resource indicators and audience restriction.**  
  **Depends on:** OIDC-010, OIDC-012, TEN-015.  
  **Done when:** clients can request only registered resources, tokens receive the narrow intended audience, scope policy is re-evaluated, and confused-deputy cases are tested.

## 11. Phase 8 — Shared UI and Hosted Authentication Application

- [ ] **UI-001 — Create the shared React UI package.**  
  **Depends on:** FND-003, FND-010.  
  **Done when:** HeroUI, Tailwind, design tokens, themes, focus styles, error patterns, and package exports work in both applications.

- [ ] **UI-002 — Add shared accessibility and interaction tests.**  
  **Depends on:** UI-001.  
  **Done when:** keyboard navigation, focus management, labels, announcements, contrast tokens, reduced motion, and common loading/error components are covered.

- [ ] **UI-003 — Add localisation foundations.**  
  **Depends on:** UI-001.  
  **Done when:** translatable strings, locale negotiation, date/number formatting, right-to-left readiness, and missing-key tests are centralised.

- [ ] **UI-004 — Create safe frontend runtime configuration.**  
  **Depends on:** RUN-001, API-015.  
  **Done when:** API URLs, public application data, branding, enabled methods, and discovery load at runtime without embedding secrets.

- [ ] **UI-005 — Create the hosted authentication app shell.**  
  **Depends on:** UI-001, UI-003, UI-004.  
  **Done when:** Vite routing, error boundaries, providers, responsive layout, CSP compatibility, and expired-flow recovery are tested.

- [ ] **UI-006 — Build the sign-up screen.**  
  **Depends on:** AUTH-004, UI-005.  
  **Done when:** validation, password guidance, policy/terms presentation, duplicate-safe submission, loading, enumeration-safe errors, and accessibility work.

- [ ] **UI-007 — Build the sign-in screen.**  
  **Depends on:** AUTH-008, UI-005.  
  **Done when:** enabled methods, redirects, errors, session continuation, browser autofill, keyboard use, and account-enumeration-safe wording work.

- [ ] **UI-008 — Build verification and resend screens.**  
  **Depends on:** AUTH-006, UI-005.  
  **Done when:** valid, invalid, expired, consumed, resend, rate-limited, and changed-email states are clear and tested.

- [ ] **UI-009 — Build password-recovery and reset screens.**  
  **Depends on:** AUTH-015, UI-005.  
  **Done when:** request, sent, expired, invalid, reset, revoked-session, and success states preserve enumeration resistance.

- [ ] **UI-010 — Build email OTP and magic-link screens.**  
  **Depends on:** AUTH-018, AUTH-019, UI-005.  
  **Done when:** resend timers, attempt limits, email-scanner handling, expiry, cross-device guidance, and fallback navigation work.

- [ ] **UI-011 — Build the OAuth authorization flow shell.**  
  **Depends on:** OIDC-007, UI-005.  
  **Done when:** validated transaction state survives sign-in and errors without reflecting unsafe redirect or client content.

- [ ] **UI-012 — Build the consent screen.**  
  **Depends on:** AUTH-021, UI-011.  
  **Done when:** verified application identity, requested permissions, data, accept, deny, policy links, and high-risk scopes are understandable and accessible.

- [ ] **UI-013 — Create the account area shell.**  
  **Depends on:** AUTH-009, UI-005.  
  **Done when:** protected routing, stale-session handling, navigation, responsive layout, and logout work.

- [ ] **UI-014 — Build profile and email management.**  
  **Depends on:** AUTH-017, AUTH-023, UI-013.  
  **Done when:** visibility, concurrency conflict, reverification, success, and error states work.

- [ ] **UI-015 — Build password and credential management.**  
  **Depends on:** AUTH-016, UI-013.  
  **Done when:** recent-authentication handling, validation, session consequences, notifications, and protected-field behaviour work.

- [ ] **UI-016 — Build session and device management.**  
  **Depends on:** AUTH-024, UI-013.  
  **Done when:** current and other sessions are distinguished and individual or global revocation updates the UI safely.

- [ ] **UI-017 — Build application-grant management.**  
  **Depends on:** AUTH-022, UI-013.  
  **Done when:** users can inspect scopes and revoke applications with a clear explanation that their shared identity remains.

- [ ] **UI-018 — Build export and deletion journeys.**  
  **Depends on:** AUTH-026, AUTH-027, UI-013.  
  **Done when:** identity confirmation, step-up hooks, retention disclosure, job progress, cancellation rules, and destructive confirmations are tested.

- [ ] **UI-019 — Add hosted-app end-to-end journeys.**  
  **Depends on:** UI-006 through UI-018.  
  **Done when:** sign-up, original-app entry, second-app consent, sign-in, recovery, account changes, session revocation, export, and deletion run against both targets.

- [ ] **UI-020 — Package hosted frontend deployment artifacts.**  
  **Depends on:** UI-019.  
  **Done when:** one static build works behind Workers assets and an unprivileged Docker web server with SPA fallback and no embedded secrets.

## 12. Phase 9 — Management Dashboard

- [ ] **MGT-001 — Create the management app shell.**  
  **Depends on:** UI-001 through UI-004, TEN-003.  
  **Done when:** protected routing, navigation, responsive layout, platform/customer area separation, errors, and session expiry are tested.

- [ ] **MGT-002 — Connect management sign-in to the platform's own authentication.**  
  **Depends on:** TEN-004, AUTH-009, OIDC-011, MGT-001.  
  **Done when:** the management application signs in through the system organisation and no dashboard-only authentication bypass exists.

- [ ] **MGT-003 — Build customer-organisation creation and switching.**  
  **Depends on:** TEN-006, TEN-012, MGT-002.  
  **Done when:** administrators create, list, select, and switch organisations while every request revalidates membership.

- [ ] **MGT-004 — Build organisation settings and environment screens.**  
  **Depends on:** TEN-007, TEN-013, MGT-003.  
  **Done when:** inherited settings, environment isolation, conflicts, permissions, suspension, and deletion warnings are clear.

- [ ] **MGT-005 — Build administrator invitation and membership screens.**  
  **Depends on:** TEN-010, TEN-011, MGT-003.  
  **Done when:** invite, resend, revoke, role change, removal, last-owner protection, and permission denial states work.

- [ ] **MGT-006 — Build application list and creation screens.**  
  **Depends on:** TEN-014, MGT-003.  
  **Done when:** every application type receives suitable guidance and environment context is explicit.

- [ ] **MGT-007 — Build application configuration screens.**  
  **Depends on:** TEN-015 through TEN-018, MGT-006.  
  **Done when:** callbacks, logout URLs, origins, scopes, token policy, authentication methods, claims, and overrides validate before saving.

- [ ] **MGT-008 — Build client-secret rotation screens.**  
  **Depends on:** TEN-017, MGT-007.  
  **Done when:** one-time reveal, copy warning, overlap, revoke, last-used metadata, and redacted later views work.

- [ ] **MGT-009 — Build user search and lifecycle screens.**  
  **Depends on:** AUTH-028, MGT-003.  
  **Done when:** pagination, filters, empty results, user detail, suspend, unblock, delete, and permission boundaries work.

- [ ] **MGT-010 — Build audit-log screens.**  
  **Depends on:** TEN-019, MGT-003.  
  **Done when:** bounded search, filters, actor/subject distinction, correlation, redaction, and export-ready navigation work.

- [ ] **MGT-011 — Build the restricted platform-administration area.**  
  **Depends on:** MGT-002, TEN-002.  
  **Done when:** platform-only navigation and API authorization are separate from customer roles and customer admins cannot infer protected data.

- [ ] **MGT-012 — Package management frontend deployment artifacts.**  
  **Depends on:** MGT-003 through MGT-011.  
  **Done when:** one static build works behind Workers assets and an unprivileged Docker web server with SPA fallback and no embedded secrets.

- [ ] **MGT-013 — Add management end-to-end journeys.**  
  **Depends on:** MGT-012.  
  **Done when:** bootstrap login, organisation switching, invitations, applications, secret rotation, users, audit, and platform-boundary denial run against both targets.

- [ ] **MGT-016 — Build branding and hosted-screen preview screens.**  
  **Depends on:** TEN-021, MGT-007.  
  **Done when:** default and application-specific branding, assets, policy links, locale content, responsive preview, publish, conflict, and rollback states work.

## 13. Phase 10 — Providers, Jobs, Events, and Webhooks

- [ ] **PRV-001 — Create provider category and capability contracts.**  
  **Depends on:** API-001, RUN-011.  
  **Done when:** stable identifiers, adapter versions, runtime support, regions, residency, optional capabilities, and operations are schema validated.

- [ ] **PRV-002 — Create provider configuration contracts.**  
  **Depends on:** PRV-001, RUN-004.  
  **Done when:** public, secret, and redacted schemas; validation; normalization; migration; and write-only secret metadata are reusable.

- [ ] **PRV-003 — Create normalized provider errors and results.**  
  **Depends on:** PRV-001.  
  **Done when:** invalid configuration, authentication, rate limit, rejection, temporary/permanent failure, residency, timeout, cancellation, and unsupported capability are represented safely.

- [ ] **PRV-004 — Create the provider registry.**  
  **Depends on:** PRV-001 through PRV-003.  
  **Done when:** only compiled definitions can register, duplicate IDs fail startup, and runtime capability mismatches prevent activation.

- [ ] **PRV-005 — Implement provider-instance creation and update.**  
  **Depends on:** DB-020, PRV-002, TEN-009.  
  **Done when:** allowed definitions, tenant scope, schema validation, secret references, redacted reads, concurrency, and audit work.

- [ ] **PRV-006 — Implement provider connection testing and health.**  
  **Depends on:** PRV-005.  
  **Done when:** tests are permissioned, rate limited, timed out, redacted, audited, and never mutate authentication state.

- [ ] **PRV-007 — Implement provider credential rotation.**  
  **Depends on:** PRV-005, RUN-004.  
  **Done when:** overlapping versions, activation, rollback, retirement, last-test metadata, and zero plaintext retrieval are supported.

- [ ] **PRV-008 — Implement provider bindings and inheritance.**  
  **Depends on:** PRV-005, TEN-018.  
  **Done when:** platform, customer, application, and allowed end-user-organisation scopes resolve most-specific valid bindings with provenance.

- [ ] **PRV-009 — Implement category-specific fallback policy.**  
  **Depends on:** PRV-003, PRV-008, API-019.  
  **Done when:** allowed delivery fallback is idempotent and identity, key, secret, and risk categories cannot silently weaken security.

- [ ] **PRV-010 — Create provider conformance harnesses.**  
  **Depends on:** PRV-001 through PRV-009.  
  **Done when:** contract, schema, success, rejection, timeout, cancellation, malformed response, retry, idempotency, redaction, isolation, migration, runtime, and residency cases are reusable.

- [ ] **PRV-011 — Implement the deterministic mock email provider.**  
  **Depends on:** PRV-010.  
  **Done when:** tests can inspect deliveries and force outcomes, while production configuration rejects the adapter.

- [ ] **PRV-012 — Implement the first production email adapter.**  
  **Depends on:** PRV-010.  
  **Done when:** a runtime-compatible transactional email integration passes conformance, sandbox, residency, and secret-handling review.

- [ ] **PRV-013 — Implement a standard SMTP email adapter.**  
  **Depends on:** PRV-010.  
  **Done when:** TLS policy, authentication, timeout, response normalization, connection limits, and both-runtime support claims are verified.

- [ ] **PRV-014 — Create the message-template system.**  
  **Depends on:** PRV-001, UI-003.  
  **Done when:** purpose, locale, safe variables, escaping, text/HTML output, versioning, preview, branding, and missing-variable failures are tested.

- [ ] **JOB-001 — Implement durable job publication through the outbox.**  
  **Depends on:** DB-021, RUN-007.  
  **Done when:** domain changes and event records commit atomically and repeated publishers do not duplicate logical jobs.

- [ ] **JOB-002 — Implement competing job consumers.**  
  **Depends on:** JOB-001.  
  **Done when:** leases, visibility timeout, bounded concurrency, acknowledgement, cancellation, and abandoned-worker recovery work across instances.

- [ ] **JOB-003 — Implement retries and dead-letter handling.**  
  **Depends on:** JOB-002.  
  **Done when:** error classification, bounded exponential backoff, attempt history, operator replay, and poison-message isolation are observable.

- [ ] **JOB-004 — Implement scheduled-work deduplication.**  
  **Depends on:** JOB-002.  
  **Done when:** duplicate scheduler triggers create one logical batch and long work checkpoints safely.

- [ ] **JOB-005 — Route verification, recovery, OTP, and security emails through jobs.**  
  **Depends on:** PRV-011, PRV-014, JOB-003, AUTH-018.  
  **Done when:** every message purpose is idempotent, localized, auditable, retryable, and cannot reveal a reusable raw authentication token in logs.

- [ ] **WHK-001 — Define versioned identity event schemas.**  
  **Depends on:** API-001, DB-021.  
  **Done when:** core user, session, consent, organisation, application, and credential events have stable IDs, versions, tenant scope, and redacted payloads.

- [ ] **WHK-002 — Implement webhook endpoint management.**  
  **Depends on:** WHK-001, TEN-009, RUN-004.  
  **Done when:** URLs, event filters, environment, status, signing-secret lifecycle, test delivery, and permissions are managed safely.

- [ ] **WHK-003 — Implement signed webhook delivery.**  
  **Depends on:** WHK-002, JOB-003.  
  **Done when:** timestamped signatures, replay tolerance, idempotency, redirects, private-network protections, timeouts, and response capture are safe.

- [ ] **WHK-004 — Implement webhook history, replay, and diagnostics.**  
  **Depends on:** WHK-003.  
  **Done when:** administrators see redacted attempts, retry or replay within policy, rotate secrets, and cannot cross tenant or environment.

- [ ] **MGT-014 — Build schema-driven provider management screens.**  
  **Depends on:** PRV-005 through PRV-009, MGT-003.  
  **Done when:** definitions, generated forms, write-only secrets, test, health, rotation, bindings, fallback, disablement, and audit history work.

- [ ] **MGT-015 — Build webhook management screens.**  
  **Depends on:** WHK-004, MGT-003.  
  **Done when:** create, test, filter, rotate, inspect, retry, disable, and delete journeys are accessible and permission aware.

## 14. Phase 11 — Production Authentication and Security

- [ ] **SEC-001 — Implement TOTP enrolment and authentication.**  
  **Depends on:** AUTH-009, RUN-003.  
  **Done when:** pending enrolment, verification, clock window, replay prevention, encrypted secrets, issuer labels, and removal controls are tested.

- [ ] **SEC-002 — Implement recovery codes.**  
  **Depends on:** SEC-001.  
  **Done when:** codes are shown once, stored hashed, single use, regenerable with step-up, and trigger notifications and audit events.

- [ ] **SEC-003 — Implement WebAuthn/passkey registration.**  
  **Depends on:** AUTH-009, DEC-009, RUN-003.  
  **Done when:** origin, relying party, challenge, attestation policy, duplicate credentials, discoverability, names, and cross-instance state are correct.

- [ ] **SEC-004 — Implement WebAuthn/passkey authentication.**  
  **Depends on:** SEC-003.  
  **Done when:** assertion validation, user verification, counters, cloned-authenticator policy, discoverable login, fallback, and audit work.

- [ ] **SEC-005 — Implement authenticator inventory and removal.**  
  **Depends on:** SEC-001 through SEC-004.  
  **Done when:** users can inspect and remove factors without removing the last recovery path or bypassing recent-authentication policy.

- [ ] **SEC-006 — Implement authentication assurance levels and step-up.**  
  **Depends on:** SEC-001 through SEC-004, AUTH-009.  
  **Done when:** sessions record methods, time, assurance, and step-up expiry; sensitive actions demand policy-defined assurance.

- [ ] **SEC-007 — Require strong authentication for platform administrators.**  
  **Depends on:** SEC-006, TEN-004.  
  **Done when:** platform administration rejects insufficient assurance and recovery follows the separate break-glass process.

- [ ] **SEC-008 — Implement configurable MFA policy.**  
  **Depends on:** SEC-006, TEN-018.  
  **Done when:** platform, customer, application, end-user role, and risk-driven requirements resolve predictably with enrolment grace rules.

- [ ] **SEC-009 — Create the social identity provider contract.**  
  **Depends on:** PRV-010, OIDC-004.  
  **Done when:** authorization metadata, state, PKCE, callback, verified claims, error normalization, and account-link input are conformance tested.

- [ ] **SEC-010 — Implement generic social OIDC connection.**  
  **Depends on:** SEC-009.  
  **Done when:** discovery, issuer, keys, nonce, claim verification, email-verification trust, callback, and secret rotation pass conformance.

- [ ] **SEC-011 — Implement safe identity linking.**  
  **Depends on:** SEC-010, AUTH-009.  
  **Done when:** recent authentication, verified ownership, conflict handling, unlink recovery, audit, and account-takeover scenarios are covered.

- [ ] **SEC-012 — Implement password-strength policy.**  
  **Depends on:** AUTH-002, TEN-018.  
  **Done when:** length, known-context rejection, user guidance, change/reset integration, and non-disclosure of policy-sensitive internals work.

- [ ] **SEC-013 — Add breached-password intelligence contract and adapter.**  
  **Depends on:** PRV-010, SEC-012.  
  **Done when:** privacy-preserving lookup, timeout policy, cached signal expiry, residency review, and create/change/reset behaviour are tested.

- [ ] **SEC-014 — Implement distributed rate limiting.**  
  **Depends on:** RUN-006, API-006.  
  **Done when:** global, IP, identity, application, organisation, endpoint, and administrative override limits are atomic across instances.

- [ ] **SEC-015 — Implement brute-force and credential-stuffing controls.**  
  **Depends on:** SEC-014, AUTH-007.  
  **Done when:** progressive delays, safe lock behaviour, distributed counters, privacy, recovery, audit, and false-positive escape paths are covered.

- [ ] **SEC-016 — Create CAPTCHA and bot-challenge contracts.**  
  **Depends on:** PRV-010, SEC-014.  
  **Done when:** challenge purpose, client configuration, server verification, replay, expiry, accessibility fallback, and explicit provider-failure policy are represented.

- [ ] **SEC-017 — Implement the initial risk-signal model.**  
  **Depends on:** DB-014, DEC-016.  
  **Done when:** source, category, confidence, expiry, tenant, user, session, network, device, and redacted evidence are stored with retention controls.

- [ ] **SEC-018 — Implement risk-policy evaluation.**  
  **Depends on:** SEC-017, SEC-006, TEN-018.  
  **Done when:** allow, deny, challenge, and step-up outcomes are explainable, versioned, audited, and default safely when a provider fails.

- [ ] **SEC-019 — Implement new-device and sensitive-change notifications.**  
  **Depends on:** JOB-005, SEC-017.  
  **Done when:** new sign-in, password, email, authenticator, recovery, and suspicious events notify through policy without notification loops.

- [ ] **SEC-020 — Implement CSRF defences.**  
  **Depends on:** DEC-009, API-006, AUTH-009.  
  **Done when:** every cookie-authenticated mutation has the chosen defence and origin, token, cross-site, login-CSRF, and logout-CSRF tests pass.

- [ ] **SEC-021 — Harden browser XSS and content policies.**  
  **Depends on:** UI-005, MGT-001.  
  **Done when:** CSP, escaping, trusted URL handling, dependency policy, frame policy, referrer policy, and injection tests cover hosted and management UIs.

- [ ] **SEC-022 — Add SSRF and unsafe-destination protection.**  
  **Depends on:** WHK-003, PRV-006.  
  **Done when:** webhook and provider tests reject loopback, link-local, internal, rebinding, unsafe redirect, and disallowed protocol targets.

- [ ] **SEC-023 — Implement API key and service-account lifecycle.**  
  **Depends on:** OIDC-019, TEN-017.  
  **Done when:** create, show once, hash, scope, owner, environment, expiry, rotate, revoke, and last-used details are available.

- [ ] **SEC-024 — Implement session policy controls.**  
  **Depends on:** AUTH-013, TEN-018.  
  **Done when:** idle, absolute, concurrent-session, remember-device, refresh lifetime, and global-revocation rules apply across instances.

- [ ] **SEC-025 — Add security regression and abuse suites.**  
  **Depends on:** SEC-001 through SEC-024.  
  **Done when:** tenant bypass, enumeration, replay, CSRF, XSS, SSRF, stuffing, rate-limit races, weak assurance, key rotation, and secret redaction pass both targets.

- [ ] **SEC-026 — Build authenticator enrolment and step-up screens.**  
  **Depends on:** SEC-001 through SEC-008, UI-013.  
  **Done when:** TOTP, recovery codes, passkeys, authenticator inventory, removal, step-up, fallback, and last-recovery-path protections are accessible.

- [ ] **SEC-027 — Build connected-identity management screens.**  
  **Depends on:** SEC-009 through SEC-011, UI-013.  
  **Done when:** users can inspect, link, and unlink external identities with recent authentication, conflict, recovery, and last-login-method protections.

- [ ] **SEC-028 — Build security activity and risk screens.**  
  **Depends on:** SEC-017 through SEC-019, MGT-009, OPS-012.  
  **Done when:** authorised administrators can inspect blocked attempts, risk reasons, compromised accounts, session events, notifications, and redacted security signals.

- [ ] **SEC-029 — Build API-key and service-account management screens.**  
  **Depends on:** SEC-023, MGT-007.  
  **Done when:** authorised administrators can create, copy once, scope, assign, expire, rotate, revoke, and inspect last use without retrieving stored secrets.

## 15. Phase 12 — End-User Organisations and Enterprise Identity

- [ ] **ORG-001 — Define end-user-organisation schemas and repositories.**  
  **Depends on:** DB-003, DB-009, DB-012.  
  **Done when:** organisations, memberships, roles, invitations, domains, policies, and active context work in both dialects with isolation tests.

- [ ] **ORG-002 — Implement end-user-organisation creation and limits.**  
  **Depends on:** ORG-001, AUTH-009, TEN-018.  
  **Done when:** permitted users create organisations atomically with owner membership and customer-configured abuse limits.

- [ ] **ORG-003 — Implement end-user-organisation update and lifecycle.**  
  **Depends on:** ORG-002.  
  **Done when:** rename, status, transfer, scheduled deletion, last-owner, retention, and audit rules are enforced.

- [ ] **ORG-004 — Implement end-user invitations.**  
  **Depends on:** ORG-002, JOB-005.  
  **Done when:** create, resend, revoke, expiry, existing-user, new-user, duplicate acceptance, and allowed-domain behaviour are covered.

- [ ] **ORG-005 — Implement end-user membership management.**  
  **Depends on:** ORG-003, ORG-004.  
  **Done when:** users can belong to unlimited organisations subject to configured limits, while role change, removal, leave, and last-owner rules remain safe.

- [ ] **ORG-006 — Implement active end-user-organisation switching.**  
  **Depends on:** ORG-005, DEC-013.  
  **Done when:** users list and switch organisations without signing out and every request revalidates membership.

- [ ] **ORG-007 — Add per-tab active-context support where practical.**  
  **Depends on:** ORG-006, DEC-009.  
  **Done when:** context can be carried safely by a validated transaction or request mechanism without one browser tab silently changing another.

- [ ] **ORG-008 — Implement reusable role sets.**  
  **Depends on:** ORG-001, DB-019.  
  **Done when:** customer defaults, end-user organisation roles, immutable identifiers, versioning, and safe deletion rules work.

- [ ] **ORG-009 — Implement application-specific role overrides.**  
  **Depends on:** ORG-008, TEN-018.  
  **Done when:** application roles can extend or override allowed defaults without affecting other applications.

- [ ] **ORG-010 — Implement groups and group-to-role assignment.**  
  **Depends on:** ORG-008.  
  **Done when:** group membership, role mapping, direct/derived permission explanation, cycles, and removal effects are correct.

- [ ] **ORG-011 — Implement organisation-aware authorization lookup.**  
  **Depends on:** ORG-006, ORG-009, ORG-010.  
  **Done when:** APIs can request live effective roles/permissions for an explicit validated tenant, application, user, and active organisation context.

- [ ] **ORG-012 — Add organisation-aware token claims.**  
  **Depends on:** ORG-011, OIDC-023.  
  **Done when:** active organisation, roles, permissions, groups, privacy, claim version, stale membership, refresh, and revocation policy are enforced.

- [ ] **ORG-013 — Implement user organisation UI.**  
  **Depends on:** ORG-002 through ORG-007, UI-013.  
  **Done when:** list, create, invite, accept, switch, leave, manage members, and active-context states are accessible.

- [ ] **ORG-014 — Implement management organisation screens.**  
  **Depends on:** ORG-002 through ORG-012, MGT-003.  
  **Done when:** administrators inspect and manage organisations, memberships, roles, groups, policies, limits, and audit events.

- [ ] **ORG-015 — Implement end-user organisation join requests.**  
  **Depends on:** ORG-003, ORG-005, ENT-001.  
  **Done when:** policy-controlled requests, verified-domain eligibility, approval, denial, expiry, duplicate submission, role defaults, notifications, and audit work.

- [ ] **ENT-001 — Implement verified-domain ownership challenges.**  
  **Depends on:** ORG-001, JOB-004, RUN-002.  
  **Done when:** challenge generation, DNS verification, expiry, recheck, conflict, takeover prevention, and loss-of-control policy work.

- [ ] **ENT-002 — Implement organisation discovery by verified domain.**  
  **Depends on:** ENT-001, AUTH-001.  
  **Done when:** discovery applies privacy policy, supports multiple matches safely, and never treats an unverified email domain as ownership.

- [ ] **ENT-003 — Create the enterprise OIDC connection contract.**  
  **Depends on:** PRV-010, OIDC-002.  
  **Done when:** discovery, metadata, client authentication, claims, domains, JIT input, health, and secret rotation are conformance tested.

- [ ] **ENT-004 — Implement generic enterprise OIDC SSO.**  
  **Depends on:** ENT-003, ENT-002.  
  **Done when:** routing, state, nonce, PKCE, issuer, keys, claims, domain binding, callback, account linking, and errors are safe.

- [ ] **ENT-005 — Create the SAML connection contract.**  
  **Depends on:** PRV-010, DEC-022.  
  **Done when:** metadata, certificates, identifiers, bindings, assertions, attributes, domains, health, and rotation are schema defined.

- [ ] **ENT-006 — Implement SAML metadata import and publication.**  
  **Depends on:** ENT-005.  
  **Done when:** parsing is hardened, unsafe XML features are disabled, certificates and endpoints are validated, and generated service metadata is stable.

- [ ] **ENT-007 — Implement SAML sign-in.**  
  **Depends on:** ENT-006, ENT-002.  
  **Done when:** signature, issuer, audience, destination, correlation, time, replay, subject, attributes, domain, and error handling pass security tests.

- [ ] **ENT-008 — Implement just-in-time provisioning.**  
  **Depends on:** ENT-004, ENT-007, ORG-005.  
  **Done when:** verified claims create or link users and memberships under explicit organisation policy with safe role defaults.

- [ ] **ENT-009 — Implement SSO enforcement and break-glass members.**  
  **Depends on:** ENT-004, ENT-007, SEC-006.  
  **Done when:** organisation policy routes eligible users to SSO while protected recovery members retain an audited alternative.

- [ ] **ENT-010 — Create SCIM 2.0 schemas and authentication.**  
  **Depends on:** ORG-010, SEC-023, DEC-022.  
  **Done when:** service-provider configuration, resource types, schemas, bearer-token rotation, filtering, pagination, and errors are standards compatible.

- [ ] **ENT-011 — Implement SCIM users.**  
  **Depends on:** ENT-010.  
  **Done when:** create, read, replace, patch, list, filter, deactivate, reactivate, idempotency, external IDs, and tenant isolation work.

- [ ] **ENT-012 — Implement SCIM groups.**  
  **Depends on:** ENT-010, ORG-010.  
  **Done when:** create, patch, membership reconciliation, deletion, group-to-role mapping, duplicate events, and large groups are handled.

- [ ] **ENT-013 — Implement directory sync jobs and checkpoints.**  
  **Depends on:** ENT-011, ENT-012, JOB-003.  
  **Done when:** cursors, incremental sync, retries, resumability, deprovisioning, conflict review, and competing workers are safe.

- [ ] **ENT-014 — Implement organisation-level authentication policies.**  
  **Depends on:** ENT-009, SEC-008, SEC-024.  
  **Done when:** allowed methods, MFA, session, password, domain, and SSO policies inherit with controlled application overrides.

- [ ] **ENT-015 — Build the customer IT Admin Portal.**  
  **Depends on:** ENT-001 through ENT-014.  
  **Done when:** delegated IT administrators verify domains, configure/test SSO, configure SCIM, rotate secrets, inspect health, and view relevant audit without full dashboard access.

- [ ] **ENT-016 — Add enterprise end-to-end and conformance suites.**  
  **Depends on:** ENT-015.  
  **Done when:** domain discovery, OIDC, SAML, JIT, enforcement, break-glass, SCIM users/groups, deprovisioning, switching, and role claims pass both runtimes.

## 16. Phase 13 — Support View and Controlled Impersonation

- [ ] **SUP-001 — Implement read-only support view.**  
  **Depends on:** AUTH-024, ORG-011, TEN-009, DEC-020.  
  **Done when:** permitted support staff can inspect effective profile, memberships, permissions, sessions, grants, and relevant events without mutation or secret access.

- [ ] **SUP-002 — Create impersonation policy and permission evaluation.**  
  **Depends on:** DEC-020, SEC-006, TEN-009.  
  **Done when:** default-disabled platform/customer settings, dedicated permission, application scope, approval mode, and expiry are enforced.

- [ ] **SUP-003 — Implement protected-target and protected-action rules.**  
  **Depends on:** SUP-002.  
  **Done when:** platform admins, owners, break-glass accounts, service accounts, credentials, MFA, recovery, keys, billing, exports, deletion, and policy changes are denied as configured.

- [ ] **SUP-004 — Implement impersonation requests and approvals.**  
  **Depends on:** SUP-002, DB-014.  
  **Done when:** reason, ticket, requested scope, assurance, user consent, owner approval, or two-person approval are recorded and race safe.

- [ ] **SUP-005 — Implement one-time actor tokens.**  
  **Depends on:** SUP-004, OIDC-022, DB-018.  
  **Done when:** tokens are short lived, single use, actor/subject bound, application/organisation scoped, and never expose an existing user session.

- [ ] **SUP-006 — Implement impersonation sessions and claims.**  
  **Depends on:** SUP-005, AUTH-009.  
  **Done when:** new sessions carry actor and subject, active context, permitted actions, assurance, correlation, no ordinary refresh continuation, and immediate revocation.

- [ ] **SUP-007 — Enforce sensitive-action denial during impersonation.**  
  **Depends on:** SUP-003, SUP-006.  
  **Done when:** API policy centrally rejects protected actions and applications can detect impersonation without trusting a client-supplied flag.

- [ ] **SUP-008 — Add immutable impersonation audit events.**  
  **Depends on:** SUP-004 through SUP-007.  
  **Done when:** request, approval, denial, start, use, blocked action, exit, expiry, and revocation share one correlation trail.

- [ ] **SUP-009 — Build the support and approval screens.**  
  **Depends on:** SUP-001, SUP-004, MGT-003.  
  **Done when:** support view is preferred, reasons and approvals are explicit, dangerous targets are unavailable, and every state is accessible.

- [ ] **SUP-010 — Build the permanent impersonation banner and exit control.**  
  **Depends on:** SUP-006, UI-013.  
  **Done when:** actor/subject state is unmistakable on every route, cannot be dismissed, and exit immediately revokes the session.

- [ ] **SUP-011 — Add impersonation notifications and analytics exclusion.**  
  **Depends on:** SUP-008, SEC-019.  
  **Done when:** configured users/owners/security contacts are notified and impersonated activity is labelled and excluded from engagement and billing.

- [ ] **SUP-012 — Add impersonation security and race tests.**  
  **Depends on:** SUP-001 through SUP-011.  
  **Done when:** cross-tenant use, stale approval, token replay, privilege increase, prohibited targets/actions, refresh, expiry, concurrent revocation, audit, and UI detection are covered.

## 17. Phase 14 — Developer Platform, Extensibility, and Migration

- [ ] **DX-001 — Define public SDK generation rules.**  
  **Depends on:** API-015, DEC-011.  
  **Done when:** naming, errors, pagination, retries, authentication, release versions, generated-code boundaries, and handwritten convenience layers are specified.

- [ ] **DX-002 — Release the browser TypeScript SDK.**  
  **Depends on:** DX-001, OIDC-025.  
  **Done when:** Authorization Code with PKCE, transaction persistence, callback, session/account APIs, errors, and framework-neutral examples work.

- [ ] **DX-003 — Release the server TypeScript SDK.**  
  **Depends on:** DX-001, OIDC-025.  
  **Done when:** authorization URL, callback, token validation, session integration, management client, retries, and safe key caching work.

- [ ] **DX-004 — Add representative non-TypeScript SDK generation.**  
  **Depends on:** DX-001, API-013.  
  **Done when:** at least one generated non-TypeScript client compiles and proves OpenAPI is not biased toward monorepo-only types.

- [ ] **DX-005 — Build the TypeScript command-line tool.**  
  **Depends on:** DX-003, OIDC-021.  
  **Done when:** device login, environment selection, safe credential storage, config export/import, user import, diagnostics, and non-interactive use are defined.

- [ ] **DX-006 — Build local development and emulator tooling.**  
  **Depends on:** API-018, PRV-011, DB-004.  
  **Done when:** one command starts SQLite, APIs, jobs, mock delivery, and both frontends with deterministic reset and sample tenants.

- [ ] **DX-007 — Implement configuration export.**  
  **Depends on:** TEN-018, PRV-008.  
  **Done when:** versioned, redacted, deterministic exports cover applications, policies, providers without secrets, roles, hooks, webhooks, and branding.

- [ ] **DX-008 — Implement configuration validation and plan.**  
  **Depends on:** DX-007.  
  **Done when:** offline and server validation report schema, permission, dependency, runtime, residency, destructive, and unsupported-capability issues.

- [ ] **DX-009 — Implement configuration import and promotion.**  
  **Depends on:** DX-008, TEN-013.  
  **Done when:** dry run, explicit environment mapping, secret references, optimistic concurrency, rollback metadata, idempotency, and audit work.

- [ ] **DX-010 — Publish infrastructure-as-code schemas.**  
  **Depends on:** DX-009.  
  **Done when:** stable machine-readable configuration can manage supported resources without dashboard-only behaviour.

- [ ] **DX-011 — Define versioned action-hook contracts.**  
  **Depends on:** WHK-001, DEC-016.  
  **Done when:** supported lifecycle points, blocking/non-blocking semantics, inputs, outputs, secrets, timeout, retry, failure policy, and version compatibility are specified.

- [ ] **DX-012 — Implement non-blocking hooks.**  
  **Depends on:** DX-011, JOB-003.  
  **Done when:** post-event hooks are durable, idempotent, observable, retryable, tenant scoped, and cannot change completed security decisions.

- [ ] **DX-013 — Implement reviewed blocking hooks.**  
  **Depends on:** DX-011, SEC-018.  
  **Done when:** only approved pre-auth/token points can block, strict timeout and fail policy apply, inputs/outputs validate, and privilege cannot be increased outside limits.

- [ ] **DX-014 — Build hook testing, versioning, rollback, and logs.**  
  **Depends on:** DX-012, DX-013.  
  **Done when:** administrators test safe payloads, inspect redacted executions, promote versions, and roll back without arbitrary dashboard-uploaded code.

- [ ] **DX-015 — Implement bulk user import format and validation.**  
  **Depends on:** AUTH-023, RUN-008.  
  **Done when:** documented schemas, dry run, duplicate strategy, metadata visibility, supported password hashes, limits, and row-level errors are defined.

- [ ] **DX-016 — Implement resumable user import jobs.**  
  **Depends on:** DX-015, JOB-003.  
  **Done when:** large imports checkpoint, resume, deduplicate, report progress, isolate failures, and produce an encrypted result.

- [ ] **DX-017 — Implement just-in-time credential migration.**  
  **Depends on:** AUTH-007, DX-015.  
  **Done when:** a reviewed migration adapter verifies legacy credentials once, upgrades to the native hash, handles outages explicitly, and prevents replay or downgrade.

- [ ] **DX-018 — Implement tenant export and migration packages.**  
  **Depends on:** DX-007, DX-016, AUTH-026.  
  **Done when:** versioned encrypted packages, manifests, checksums, supported resources, omissions, compatibility reports, and restore validation are documented.

- [ ] **DX-019 — Add migration rollback and reconciliation reports.**  
  **Depends on:** DX-018.  
  **Done when:** operators can compare counts, identities, grants, roles, credentials, and errors without exposing secrets.

- [ ] **DX-020 — Create public integration examples.**  
  **Depends on:** DX-002 through DX-005.  
  **Done when:** server web, SPA, native/device, API validation, machine client, organisation switching, webhook verification, and consent examples compile and test.

- [ ] **DX-021 — Build developer documentation publishing.**  
  **Depends on:** API-011, DX-020.  
  **Done when:** versioned OpenAPI, interactive docs, quick starts, concepts, errors, security guidance, migration notes, and runnable examples publish reproducibly.

- [ ] **DX-022 — Build embeddable authentication and account components.**  
  **Depends on:** DX-002, UI-001, SEC-026, SEC-027.  
  **Done when:** framework-neutral browser primitives and React components support documented theming, accessibility, hosted fallback, secure transactions, and version compatibility.

- [ ] **DX-023 — Publish native mobile and desktop integration guidance.**  
  **Depends on:** DX-002, OIDC-025.  
  **Done when:** system-browser Authorization Code with PKCE, deep links, loopback redirects where appropriate, secure token storage boundaries, logout, and sample applications are tested.

- [ ] **DX-024 — Build hook management screens.**  
  **Depends on:** DX-014, MGT-003.  
  **Done when:** authorised administrators create versions, test safe payloads, inspect redacted logs, promote, disable, and roll back hooks.

- [ ] **DX-025 — Build configuration promotion screens.**  
  **Depends on:** DX-009, MGT-004.  
  **Done when:** administrators export, validate, diff, dry run, approve, promote, inspect results, and recover from conflicts across environments.

## 18. Phase 15 — Deployment, Scaling, Residency, and Operations

- [ ] **OPS-001 — Create minimal unprivileged API Docker images.**  
  **Depends on:** API-016, FND-014.  
  **Done when:** pruned multi-stage builds contain only target dependencies, run without root, expose health, handle termination, and pass vulnerability review.

- [ ] **OPS-002 — Create unprivileged frontend Docker images.**  
  **Depends on:** UI-020, MGT-012.  
  **Done when:** static assets, SPA fallback, caching, compression, security headers, health, and immutable configuration loading work.

- [ ] **OPS-003 — Create the self-hosted Compose example.**  
  **Depends on:** OPS-001, OPS-002, DB-005, JOB-003.  
  **Done when:** APIs, frontends, jobs, PostgreSQL, queue/cache choice, secrets, health, migrations, and local TLS guidance start reproducibly.

- [ ] **OPS-004 — Create Cloudflare Workers deployment packages.**  
  **Depends on:** API-017, UI-020, MGT-012.  
  **Done when:** each application builds independently, binds only declared capabilities, excludes Node adapters, and passes preview smoke tests.

- [ ] **OPS-005 — Implement PostgreSQL connectivity for Node.**  
  **Depends on:** DB-005, OPS-001.  
  **Done when:** bounded pools, timeouts, health, backpressure, transaction cleanup, graceful shutdown, and saturation tests work.

- [ ] **OPS-006 — Implement PostgreSQL connectivity for Workers.**  
  **Depends on:** DB-005, OPS-004.  
  **Done when:** the selected compatible connection path has bounded use, transaction semantics, health, failover behaviour, and European residency review.

- [ ] **OPS-007 — Implement production queue adapters.**  
  **Depends on:** RUN-007, RUN-017, RUN-018, JOB-003.  
  **Done when:** separately packaged Workers-hosted and production self-hosted choices pass queue conformance, duplicate delivery, lease expiry, dead-letter, scale, configuration, and residency tests.

- [ ] **OPS-008 — Implement production distributed cache/rate-limit adapters.**  
  **Depends on:** RUN-006, RUN-017, RUN-018, SEC-014.  
  **Done when:** separately packaged hosted and production self-hosted choices pass atomicity, expiry, versioning, outage, fail-safe authorization, scale, configuration, and residency tests.

- [ ] **OPS-009 — Implement production object-storage adapters.**  
  **Depends on:** RUN-008, RUN-017, RUN-018, AUTH-026.  
  **Done when:** separately packaged hosted and production self-hosted choices pass integrity, encryption, signed access, expiry, deletion, retention, failover, configuration, and European residency checks.

- [ ] **OPS-010 — Implement production secret-storage adapters.**  
  **Depends on:** RUN-004, RUN-017, RUN-018, PRV-007.  
  **Done when:** separately packaged hosted and production self-hosted choices pass access, version, rotation, redaction, outage, audit, configuration, and residency conformance.

- [ ] **OPS-011 — Implement production key-management adapters.**  
  **Depends on:** RUN-005, RUN-017, RUN-018, OIDC-024.  
  **Done when:** separately packaged hosted and production self-hosted choices pass signing, verification, encryption, wrapping, rotation, latency, outage, audit, custody, configuration, and residency tests.

- [ ] **OPS-012 — Implement structured logs, metrics, and traces.**  
  **Depends on:** RUN-009, RUN-017, RUN-018, DEC-021.  
  **Done when:** separately packaged hosted and production self-hosted observability adapters emit correlated, redacted telemetry for HTTP, authentication, database, jobs, providers, and webhooks.

- [ ] **OPS-013 — Build health, service-status, and alert rules.**  
  **Depends on:** RUN-014, OPS-012.  
  **Done when:** dependency, error-rate, latency, queue-age, delivery, key, database, saturation, and residency-relevant failures alert with runbook links.

- [ ] **OPS-014 — Add multiple-API-instance tests.**  
  **Depends on:** OPS-005 or OPS-006, OPS-008.  
  **Done when:** requests deliberately move between instances during login, consent, refresh, switching, revocation, and administration without correctness changes.

- [ ] **OPS-015 — Add multiple-worker and duplicate-delivery tests.**  
  **Depends on:** OPS-007, JOB-004.  
  **Done when:** competing workers, duplicate queues, termination, lease expiry, resume, and scheduler duplication are harmless.

- [ ] **OPS-016 — Add load and soak testing.**  
  **Depends on:** OPS-014, OPS-015, DEC-021.  
  **Done when:** sign-in peaks, refresh, switching, audit ingestion, webhooks, connection limits, memory, timers, and resource leaks meet targets.

- [ ] **OPS-017 — Create the dedicated migration release task.**  
  **Depends on:** DB-024, OPS-005, OPS-006.  
  **Done when:** applications never migrate independently, readiness checks schema compatibility, and rolling versions tolerate current and previous schemas.

- [ ] **OPS-018 — Implement zero-downtime rolling deployment checks.**  
  **Depends on:** OPS-017, OPS-014, OPS-015.  
  **Done when:** old/new APIs and workers overlap with versioned messages, graceful shutdown, schema compatibility, and rollback.

- [ ] **OPS-019 — Implement backup and restore automation.**  
  **Depends on:** OPS-005, OPS-009, DEC-018.  
  **Done when:** encrypted European backups, retention, restore drills, integrity checks, key access, personal-data expiry, and documented RPO/RTO work.

- [ ] **OPS-020 — Create disaster-recovery and regional-failure runbooks.**  
  **Depends on:** OPS-019, DEC-021.  
  **Done when:** detection, authority, database, object, queue, keys, DNS, communications, recovery order, validation, and post-incident steps are exercised.

- [ ] **OPS-021 — Complete Cloudflare data-localisation validation.**  
  **Depends on:** DEC-018, OPS-004, OPS-006 through OPS-012.  
  **Done when:** request execution, subrequests, queues, scheduled work, logs, analytics, storage, secrets, support, and fallbacks have evidence for European processing or move to approved European infrastructure.

- [ ] **OPS-022 — Implement hosted custom-domain onboarding.**  
  **Depends on:** ENT-001, OPS-004, RUN-019.  
  **Done when:** domain request, DNS challenge, ownership, conflict, CNAME verification, status, retry, deletion, and takeover prevention work through a selected DNS automation adapter.

- [ ] **OPS-023 — Automate TLS certificate lifecycle.**  
  **Depends on:** OPS-022, RUN-019.  
  **Done when:** issuance, validation, activation, renewal, expiry alert, revocation, domain removal, and failed-renewal recovery work through a selected certificate automation adapter.

- [ ] **OPS-024 — Automate hosted frontend deployments.**  
  **Depends on:** OPS-022, OPS-023, UI-020, RUN-019.  
  **Done when:** versioned branding/configuration deploys, verifies, and rolls back through a deployment adapter without exposing another tenant's assets or secrets.

- [ ] **OPS-025 — Write self-hosted installation and upgrade runbooks.**  
  **Depends on:** OPS-003, OPS-017 through OPS-020.  
  **Done when:** sizing, DNS, TLS, secrets, keys, database, queues, email, backups, monitoring, upgrades, rollback, and recovery are documented and tested from a clean host.

- [ ] **OPS-026 — Validate the provider-independent self-hosted infrastructure profile.**  
  **Depends on:** OPS-003, OPS-007 through OPS-012, OPS-025.  
  **Done when:** a self-hosted operator can select documented production queue, cache, object-storage, secret, key-management, and observability adapters through configuration without changing or forking core application code.

- [ ] **OPS-027 — Build hosted custom-domain management screens.**  
  **Depends on:** OPS-022 through OPS-024, MGT-004.  
  **Done when:** authorised administrators request domains, copy DNS records, monitor verification and certificates, retry failures, activate, roll back, and remove domains safely.

## 19. Phase 16 — Privacy, Audit, Analytics, and Commercial Controls

- [ ] **GOV-001 — Implement retention-policy configuration.**  
  **Depends on:** DEC-017, TEN-018.  
  **Done when:** supported record classes have safe minimum/maximum periods, legal-hold interaction, inherited defaults, and documented deletion semantics.

- [ ] **GOV-002 — Implement durable retention and expiry jobs.**  
  **Depends on:** GOV-001, JOB-004.  
  **Done when:** jobs are resumable, idempotent, auditable, bounded, partition friendly, and preserve required integrity without retaining unnecessary personal data.

- [ ] **GOV-003 — Implement rectification workflows.**  
  **Depends on:** AUTH-017, AUTH-023, ORG-005.  
  **Done when:** administrators and users can correct allowed data while verified identifiers, audit history, conflicts, and notifications remain safe.

- [ ] **GOV-004 — Implement complete data-subject export orchestration.**  
  **Depends on:** AUTH-026, ORG-001, SUP-008, GOV-001.  
  **Done when:** all applicable identity, membership, consent, session, support, and audit-derived data is included or exclusions are documented.

- [ ] **GOV-005 — Implement complete account and tenant erasure orchestration.**  
  **Depends on:** AUTH-027, TEN-008, GOV-001, GOV-002.  
  **Done when:** dependencies, providers, exports, logs, backups, grace periods, legal holds, anonymisation, and completion evidence are handled.

- [ ] **GOV-006 — Implement versioned terms, privacy, and consent acceptance.**  
  **Depends on:** AUTH-021, DB-014.  
  **Done when:** policy versions, presentation, acceptance, lawful-basis metadata where configured, withdrawal, and reacceptance rules are auditable.

- [ ] **GOV-007 — Create subprocessor and data-flow records.**  
  **Depends on:** DEC-018, PRV-008.  
  **Done when:** active providers and runtime services can report region, data categories, purposes, transfer basis, and operator-facing disclosures.

- [ ] **GOV-008 — Implement audit-log export and long-term archive.**  
  **Depends on:** TEN-019, RUN-008, GOV-001.  
  **Done when:** immutable batches, signatures/checksums, cursors, encryption, retention, retrieval, redaction, and tenant scope are verified.

- [ ] **GOV-009 — Implement customer log streaming.**  
  **Depends on:** GOV-008, PRV-010.  
  **Done when:** streaming adapters support filtering, batching, cursoring, signing, acknowledgement, retry, dead letters, health, and residency.

- [ ] **GOV-010 — Implement authentication and security analytics.**  
  **Depends on:** OPS-012, SEC-017.  
  **Done when:** aggregate sign-in, failure, method, risk, delivery, session, and application metrics minimise personal data and exclude impersonation.

- [ ] **GOV-011 — Implement usage metering.**  
  **Depends on:** OPS-012, TEN-013.  
  **Done when:** billable events are versioned, deduplicated, environment aware, auditable, and independent of engagement analytics.

- [ ] **GOV-012 — Implement plans, quotas, and limits.**  
  **Depends on:** GOV-011.  
  **Done when:** plan entitlements, soft/hard limits, grace, administrative overrides, notifications, and fail-safe security behaviour are enforced.

- [ ] **GOV-013 — Build usage and billing screens.**  
  **Depends on:** GOV-012, MGT-003.  
  **Done when:** authorised roles can understand current usage, limits, forecast, overage, plan restrictions, and metering periods.

- [ ] **GOV-014 — Create incident-response and breach-notification runbooks.**  
  **Depends on:** OPS-013, DEC-017, DEC-021.  
  **Done when:** evidence preservation, containment, support access, processor coordination, impact assessment, notification decision, communications, and review are rehearsed.

- [ ] **GOV-015 — Complete GDPR operational-readiness review.**  
  **Depends on:** GOV-001 through GOV-014, OPS-021.  
  **Done when:** technical controls, policies, contracts, records, data-processing agreements, subprocessors, support procedures, and evidence gaps are reviewed by qualified owners.

## 20. Phase 17 — Advanced Platform Capabilities

- [ ] **ADV-001 — Implement SMS and voice provider contracts.**  
  **Depends on:** PRV-010, AUTH-018.  
  **Done when:** regional sender, templates, delivery IDs, OTP safety, fraud controls, fallback, and normalized errors are conformance tested.

- [ ] **ADV-002 — Implement SMS OTP authentication.**  
  **Depends on:** ADV-001, SEC-014, SEC-018.  
  **Done when:** phone verification, send and attempt limits, fraud/risk policy, single use, recovery cautions, and delivery uncertainty are handled.

- [ ] **ADV-003 — Implement customer email/SMS templates and localisation.**  
  **Depends on:** PRV-014, MGT-014.  
  **Done when:** branding, locale, safe variables, preview, versioning, fallback, injection protection, and per-purpose permissions work.

- [ ] **ADV-004 — Add multiple social identity connections.**  
  **Depends on:** SEC-009 through SEC-011.  
  **Done when:** each compiled adapter passes common conformance and provider-specific issuer, claim, callback, secret, and policy tests.

- [ ] **ADV-005 — Add fine-grained relationship authorization.**  
  **Depends on:** ORG-011.  
  **Done when:** a documented customer need, tuple/policy model, tenant isolation, consistency, explainability, migration, limits, and live-lookup path are validated.

- [ ] **ADV-006 — Add certificate/private-key client authentication.**  
  **Depends on:** OIDC-019, RUN-005.  
  **Done when:** client assertion or certificate methods validate audience, time, replay, key ownership, rotation, revocation, and errors.

- [ ] **ADV-007 — Evaluate proof-of-possession tokens.**  
  **Depends on:** OIDC-025, DEC-022.  
  **Done when:** threat addressed, target clients, key binding, nonce/replay, proxy impact, SDK impact, and rollout decision are documented before implementation.

- [ ] **ADV-008 — Implement workload identity federation.**  
  **Depends on:** OIDC-022, ADV-006.  
  **Done when:** trusted issuer, subject mapping, audience, short lifetime, policy, rotation, revocation, and audit avoid long-lived static secrets.

- [ ] **ADV-009 — Implement customer-managed encryption keys.**  
  **Depends on:** OPS-011, GOV-015.  
  **Done when:** eligibility, key validation, wrapping hierarchy, rotation, disablement, outage, deletion, recovery, audit, and residency are safe.

- [ ] **ADV-010 — Add advanced adaptive-authentication signals.**  
  **Depends on:** SEC-017, SEC-018.  
  **Done when:** device, network, reputation, impossible travel, behavioural anomalies, data minimisation, expiry, false positives, and explainability are reviewed.

- [ ] **ADV-011 — Add customer network controls.**  
  **Depends on:** SEC-018, TEN-018.  
  **Done when:** allow-lists, trusted proxies, network zones, IPv4/IPv6, lockout prevention, break-glass, and audit are implemented.

- [ ] **ADV-012 — Add self-hosted high-availability validation.**  
  **Depends on:** OPS-016, OPS-018 through OPS-020, OPS-025.  
  **Done when:** documented topologies survive API, worker, database, cache, queue, object, and key-service failures within targets.

- [ ] **ADV-013 — Add automated compatibility reports and provider importers.**  
  **Depends on:** DX-018, DX-019.  
  **Done when:** supported source formats map identities, credentials, grants, organisations, roles, and gaps without naming a provider in the core domain.

- [ ] **ADV-014 — Add OAuth support for agent and tool clients.**  
  **Depends on:** OIDC-021, OIDC-022, SEC-023.  
  **Done when:** discovery, dynamic or pre-registration policy, redirect patterns, device/headless flows, scopes, resource indicators, consent, and revocation meet the chosen standards.

- [ ] **ADV-015 — Add configuration policy validation and promotion approvals.**  
  **Depends on:** DX-009, DX-010.  
  **Done when:** production promotion can require validation, diff, approval, separation of duties, scheduled activation, rollback, and audit.

- [ ] **ADV-016 — Implement initial production SMS adapters.**  
  **Depends on:** ADV-001, RUN-017, PRV-010.  
  **Done when:** hosted and self-hosted-compatible choices pass delivery, error, idempotency, timeout, sender, fraud, secret, runtime, and European residency conformance.

## 21. Phase 18 — Release Gates and General Availability

- [ ] **REL-001 — Define supported deployment profiles.**  
  **Depends on:** OPS-004, OPS-026.  
  **Done when:** hosted Workers, hosted European containers where required, and self-hosted Docker profiles list supported adapters, dependencies, scaling limits, and exclusions.

- [ ] **REL-002 — Freeze and review the first stable public API.**  
  **Depends on:** API-013, DX-021.  
  **Done when:** naming, errors, pagination, authentication, scopes, webhooks, examples, deprecations, and generated SDKs receive cross-team review.

- [ ] **REL-003 — Complete end-to-end acceptance coverage.**  
  **Depends on:** UI-019, MGT-013, OIDC-025, ENT-016, SUP-012.  
  **Done when:** every supported primary journey and denied counterpart runs against Workers and Docker using SQLite where supported and PostgreSQL production paths.

- [ ] **REL-004 — Complete scale and failure acceptance.**  
  **Depends on:** OPS-016, OPS-018, OPS-020.  
  **Done when:** measured capacity, autoscaling signals, backpressure, dependency loss, duplicate work, rolling release, restore, and disaster exercises meet targets.

- [ ] **REL-005 — Complete security architecture review.**  
  **Depends on:** SEC-025, SUP-012, ADV-009 if enabled.  
  **Done when:** threat model, protocol choices, keys, cookies, tenant isolation, providers, support access, supply chain, and operational controls have no unowned critical findings.

- [ ] **REL-006 — Complete independent penetration testing.**  
  **Depends on:** REL-003, REL-005.  
  **Done when:** scoped external testing covers APIs, hosted UI, management UI, OAuth/OIDC, SSO/SCIM, tenancy, impersonation, Workers, Docker, and retesting of resolved findings.

- [ ] **REL-007 — Complete privacy and residency acceptance.**  
  **Depends on:** GOV-015, OPS-021.  
  **Done when:** production evidence verifies European hosting and processing claims, retention, export, deletion, support access, backups, and subprocessors.

- [ ] **REL-008 — Complete self-hosted install and upgrade acceptance.**  
  **Depends on:** OPS-026, ADV-012.  
  **Done when:** a clean installation, bootstrap, backup, restore, rolling upgrade, rollback, recovery, monitoring, and removal are executed only from published instructions.

- [ ] **REL-009 — Complete hosted production-readiness review.**  
  **Depends on:** REL-004 through REL-007, OPS-024.  
  **Done when:** on-call, alerts, runbooks, capacity, support controls, domain automation, backups, incident process, status communication, and launch rollback are approved.

- [ ] **REL-010 — Publish the general-availability release.**  
  **Depends on:** REL-001 through REL-009.  
  **Done when:** signed artifacts, migrations, OpenAPI, SDKs, documentation, change log, known limits, security contact, support policy, and rollback evidence are published together.

## 22. Milestone Completion Gates

### M0 — Engineering Foundation

Complete when:

- DEC-001 through DEC-022 are either completed or explicitly scheduled before their first consumer.
- FND-001 through FND-020 pass on a clean checkout.
- RUN-001 through RUN-020 have conformance-tested implementations.
- DB-001 through DB-025 pass against SQLite, PostgreSQL, and the applicable local Workers database path.
- API-001 through API-019 run equivalently through Docker and Workers shells.

### M1 — Core Authentication MVP

Complete when:

- TEN-001 through TEN-021 are complete.
- AUTH-001 through AUTH-029 are complete; AUTH-030 is required when phone authentication is enabled.
- OIDC-001 through OIDC-027 are complete.
- UI-001 through UI-020, MGT-001 through MGT-013, and MGT-016 are complete.
- The platform authenticates its own management dashboard through the protected system organisation.
- A user can sign up through one application and consent before first entry to another application in the same shared user pool.

### M2 — Production Beta

Complete when:

- PRV-001 through PRV-014, JOB-001 through JOB-005, and WHK-001 through WHK-004 are complete.
- MGT-014 and MGT-015 are complete.
- SEC-001 through SEC-029 are complete.
- OPS-001 through OPS-021 are complete for the selected beta deployment.
- Load, failure, runtime, repository, protocol, and security test suites pass.

### M3 — Enterprise Identity

Complete when:

- ORG-001 through ORG-015 and ENT-001 through ENT-016 are complete.
- SUP-001 through SUP-012 are complete.
- Users can belong to and switch among multiple end-user organisations.
- Organisation role defaults, application overrides, enterprise SSO, SCIM, and break-glass rules work together.
- The customer IT Admin Portal supports self-service enterprise configuration.

### M4 — General Availability and Maturity

Complete when:

- DX-001 through DX-025 are complete for the supported SDK and migration scope.
- OPS-001 through OPS-027 are complete for every supported deployment profile.
- GOV-001 through GOV-015 are complete.
- Applicable ADV tasks are either complete or explicitly excluded from the first stable release.
- REL-001 through REL-010 are complete.

## 23. Suggested First 20 Tasks

This is the shortest practical starting sequence:

1. DEC-001 — Decision-record template and index.
2. DEC-002 — Package manager.
3. DEC-003 — Supported runtime versions.
4. DEC-004 — Test toolchain.
5. DEC-005 — Hono contract spike.
6. DEC-010 — Identifier and timestamp conventions.
7. DEC-011 — API versioning.
8. DEC-012 — Shared API conventions.
9. FND-001 — Workspace root.
10. FND-002 — Monorepo directory structure.
11. FND-003 — Strict TypeScript configurations.
12. FND-004 — Formatting.
13. FND-005 — Linting.
14. FND-006 — 250-line checker.
15. FND-007 — Package boundaries.
16. FND-008 — Unit/schema testing.
17. FND-009 — Type testing.
18. FND-012 — Complete coverage enforcement.
19. FND-014 — Turborepo task graph.
20. FND-016 — Full clean-checkout CI.

After these are complete, continue the remaining decision tasks while runtime contracts, database foundations, and deployable API shells begin.
