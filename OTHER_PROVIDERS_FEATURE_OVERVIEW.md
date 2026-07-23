# Other Providers — Feature Overview

## 1. Purpose

This document contains market research and named third-party provider examples used to inform the authentication platform plan.

Keeping this information separate allows the main product and architecture specification to remain focused on this product rather than presenting it as a collection of competitor features.

Research was conducted against official documentation on 23 July 2026. Provider functionality and plan availability can change, so source documentation should be checked again before making implementation or purchasing decisions.

## 2. Authentication and Identity Platforms Reviewed

The review covers developer-first, enterprise, cloud-platform, and self-hosted customer-identity products.

| Provider | Notable capabilities |
| --- | --- |
| [Auth0](https://auth0.com/docs/manage-users/organizations) / Okta Customer Identity | B2B organisations with connections, members, roles, and per-organisation branding; versioned [Actions](https://auth0.com/docs/customize/actions/actions-overview) for authentication hooks; and mature [attack protection](https://auth0.com/docs/secure/attack-protection) covering bots, breached passwords, brute force, and suspicious IP activity. |
| [Clerk](https://clerk.com/docs/guides/organizations/overview) | Prebuilt authentication and organisation components, active-organisation switching, role sets, verified domains, enterprise connections, [step-up reverification and session controls](https://clerk.com/docs/guides/secure/overview), and actor-token-based [user impersonation](https://clerk.com/docs/guides/users/impersonation). |
| [WorkOS](https://workos.com/docs/llms.txt) | Authentication plus enterprise SSO, SCIM Directory Sync, RBAC, fine-grained authorization, Audit Logs, Admin Portal, Vault/BYOK, domain verification, customer API keys, and [impersonation](https://workos.com/docs/authkit/impersonation). |
| [Stytch](https://stytch.com/docs/multi-tenant-auth/data-model) | Organisation-specific authentication and MFA policies, JIT provisioning, SSO, SCIM, cross-organisation identity options, fraud and risk tooling, and explicit [break-glass members](https://stytch.com/docs/multi-tenant-auth/enterprise-ready/org-management/configure-auth-methods). |
| [Descope](https://docs.descope.com/) | Visual authentication-flow builder, adaptive MFA, broad passwordless methods, tenant-aware policy, and self-service SSO and SCIM setup. Its [authentication catalogue](https://docs.descope.com/auth-methods) includes OTP, magic and cross-device links, passkeys, social login, TOTP, passwords, recovery codes, and device authentication. |
| [Amazon Cognito](https://docs.aws.amazon.com/cognito/latest/developerguide/what-is-amazon-cognito.html) | Managed login or custom UI, user and identity pools, social and enterprise federation, passkeys, passwordless and MFA, AWS credential federation, custom claims, adaptive threat protection, and extensive [Lambda lifecycle triggers](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-pools-working-with-lambda-triggers.html). |
| [Google Cloud Identity Platform](https://docs.cloud.google.com/identity-platform/docs/multi-tenancy) / Firebase Authentication | User and configuration silos through multi-tenancy, email and social authentication, SAML and OIDC federation, MFA, blocking functions, session cookies, and integration with Firebase and Google Cloud services. |
| [Microsoft Entra External ID](https://learn.microsoft.com/en-us/entra/external-id/customers/overview-customers-ciam) | External customer tenants, self-service user flows, social and enterprise federation, conditional access, MFA, machine-to-machine authentication, custom attributes and claims, native authentication, and server-side custom authentication extensions. |
| [Supabase Auth](https://supabase.com/docs/guides/auth) | Password, OTP, magic link, social login, SSO, MFA, identity linking, CAPTCHA, audit logs, custom hooks, and integration with PostgreSQL row-level security. |
| [Keycloak](https://www.keycloak.org/docs/latest/server_admin/) | Open-source self-hosting, isolated realms, OIDC and SAML, identity brokering, LDAP/Active Directory federation, organisations, configurable flows and themes, fine-grained administration, events, account console, and built-in administrator impersonation. |
| [FusionAuth](https://fusionauth.io/docs/get-started/core-concepts/) | Hosted or single-tenant self-hosted deployment, isolated tenants, applications, roles, groups, themes, webhooks, lambdas, MFA, WebAuthn, SAML, SCIM, threat detection, and application [registrations](https://fusionauth.io/docs/get-started/core-concepts/registrations) that separate authentication from application authorization. |
| [Ory](https://www.ory.sh/docs/self-hosted/oel) | Headless and composable identity, session, OAuth/OIDC, permission, SSO, and API-key services; schema-driven identities; hooks; cloud and self-hosted deployment; and enterprise multi-tenancy and data-domiciling options. |
| [ZITADEL](https://zitadel.com/features) | Organisations, projects, delegated administration, hosted or self-hosted deployment, passkeys, actions, APIs, and an event-sourced audit trail. It implements standards-based [token exchange for delegation and impersonation](https://zitadel.com/docs/guides/integrate/token-exchange). |

## 3. Common Feature Groups

The research produced the following recurring feature groups:

### 3.1 Authentication

- Password, passwordless, OTP, magic link, social login, passkeys, and MFA.
- Hosted UI, embeddable components, and headless APIs.
- Identity linking, account recovery, credential management, and session management.
- Step-up authentication, adaptive MFA, and authentication assurance levels.

### 3.2 Business-to-Business Identity

- Organisations, active organisation switching, invitations, roles, groups, and permissions.
- Verified domains, home-realm discovery, JIT provisioning, and SSO enforcement.
- Enterprise SSO through SAML and OIDC.
- SCIM, directory sync, group mapping, and deprovisioning.
- Self-service portals for customer IT administrators.

### 3.3 Security and Operations

- Breached-password, bot, brute-force, credential-stuffing, and suspicious-IP protection.
- Risk assessment, conditional access, session revocation, and user notifications.
- Immutable audit trails, log export, SIEM streaming, analytics, and alerts.
- Key rotation, customer-managed keys, regional deployment, and data residency.

### 3.4 Developer Platform

- Strong API contracts, SDKs, webhooks, actions, lifecycle hooks, and custom claims.
- Development and production environments.
- Configuration promotion and infrastructure-as-code support.
- Migration, password-hash import, JIT migration, and bulk user operations.
- Machine-to-machine, API-key, device, CLI, delegation, and token-exchange flows.

### 3.5 Support Tooling

- User search, session inspection, account suspension, unblock, recovery, and revocation.
- Read-only support views.
- Short-lived, actor-aware, audited impersonation.
- Delivery diagnostics for email, SMS, webhooks, SSO, and directory synchronization.

## 4. Integration Provider Examples

The authentication platform's adapter system can eventually support providers such as:

| Category | Potential integrations |
| --- | --- |
| Email | Amazon SES, SendGrid, Postmark, Mailgun, and standard SMTP. |
| SMS and voice | Twilio, Amazon SNS, Vonage, and private gateways. |
| Social identity | Google, Apple, Microsoft, GitHub, and generic OAuth/OIDC providers. |
| Enterprise directories | Microsoft Entra ID, Okta, Google Workspace, and generic SCIM 2.0 directories. |
| CAPTCHA and bot challenges | Cloudflare Turnstile, reCAPTCHA, hCaptcha, and compatible challenge services. |
| Object storage | Cloudflare R2, Amazon S3, and compatible European object-storage services. |
| Secret management | Cloudflare secrets, container secrets, HashiCorp Vault, and cloud secret managers. |
| Key management | Cloud KMS products, HSM-backed services, software keys, and customer-managed keys. |
| Audit and observability | OpenTelemetry, SIEM collectors, webhooks, object-storage archives, and managed event delivery. |

These names are examples rather than commitments. An integration becomes supported only after its adapter passes the contract, security, runtime, failure, and residency conformance suites defined in the main architecture.

## 5. Design Conclusions

The most important conclusions applied to the product plan are:

- Shared identity must not imply automatic application authorization.
- Enterprise configuration should be self-service.
- Organisation defaults should support explicit application overrides.
- Hosted UI should be complemented by components and headless APIs.
- Extensibility needs versioning, testing, rollback, logs, timeouts, and safe failure behaviour.
- Migration tooling is required for realistic adoption.
- Support tooling and controlled impersonation should be designed early.
- Security protections need strong defaults rather than optional afterthoughts.
- Hosted and self-hosted editions should share the same domain and protocol model.
