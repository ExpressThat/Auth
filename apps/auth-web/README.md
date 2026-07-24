# Auth Web

Status: planned application shell.

Owns the React identity and account experience: sign-up, sign-in, consent,
recovery, security, profile, sessions, and organisation switching. It consumes
public API contracts and never imports repositories, provider SDKs, or secrets.

The Vite output is packaged for Docker with equivalent hosted and self-hosted
security and accessibility behavior. See the
[workspace register](../../docs/architecture/workspace-ownership.md).
