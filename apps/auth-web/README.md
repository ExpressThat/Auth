# Auth Web

Status: planned application shell.

Owns the React identity and account experience: sign-up, sign-in, consent,
recovery, security, profile, sessions, and organisation switching. It consumes
public API contracts and never imports repositories, provider SDKs, or secrets.

The Vite output must deploy through Workers and Docker with equivalent security
and accessibility behavior. See the
[workspace register](../../docs/architecture/workspace-ownership.md).
