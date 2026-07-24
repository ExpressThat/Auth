# Argon2 Password Provider

`@expressthat-auth/password-argon2` supplies the production Argon2id
implementations of the provider-neutral `PasswordHasher` contract.

The preferred Node.js implementation uses `@node-rs/argon2`. The portable
TypeScript implementation uses `@noble/hashes` so stored credentials remain
verifiable across supported Docker architectures. Both adapters:

- receive salts from an injected cryptographically secure `RandomSource`;
- produce the same standard PHC text for the same password and salt;
- reject malformed or unapproved PHC input before expensive verification;
- cross-verify each other's output; and
- conform to the policy and vectors in
  [ADR-0006](../../../docs/decisions/0006-password-hashing.md).

Applications select an adapter explicitly at their composition root. Domain
packages depend only on the runtime contract and never import this package.

## Development

```bash
pnpm --filter @expressthat-auth/password-argon2 typecheck
pnpm --filter @expressthat-auth/password-argon2 test
pnpm --filter @expressthat-auth/password-argon2 test:coverage
pnpm --filter @expressthat-auth/password-argon2 test:types
```
