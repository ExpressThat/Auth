---
task: RUN-003
category: added
audiences: developers, operators
surfaces: runtime, cryptography, credentials
breaking: false
migration: none
security: purpose-bound-crypto-and-redacted-password-hashes
---

Added password-hasher, exact-byte signing, verification, authenticated
encryption, opaque key-handle, and public key-metadata contracts with Argon2id,
RSA, and AES-GCM conformance vectors.
