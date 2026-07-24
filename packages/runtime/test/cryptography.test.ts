import { describe, expect, it } from "vitest";
import {
  EpochMilliseconds,
  KeyHandle,
  MAX_STORED_PASSWORD_HASH_BYTES,
  PasswordHash,
} from "../src/index.js";
import { TestWebCryptoAdapter } from "./crypto-test-adapter.js";

// biome-ignore lint/security/noSecrets: deliberately synthetic non-credential hash fixture.
const SYNTHETIC_HASH = "$argon2id$synthetic";
// biome-ignore lint/security/noSecrets: public NIST AES-256-GCM test vector.
const AES_GCM_VECTOR = "cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919";

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function fixture(): Promise<TestWebCryptoAdapter> {
  const signingKeys = await crypto.subtle.generateKey(
    {
      hash: "SHA-256",
      modulusLength: 2048,
      name: "RSASSA-PKCS1-v1_5",
      publicExponent: new Uint8Array([1, 0, 1]),
    },
    false,
    ["sign", "verify"],
  );
  const encryptionKey = await crypto.subtle.importKey("raw", new Uint8Array(32), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  return new TestWebCryptoAdapter(
    {
      handle: "test:rsa:key",
      metadata: {
        algorithm: "RS256",
        createdAt: EpochMilliseconds.parse(1),
        keyId: "test-rsa-key",
        publicJwk: await crypto.subtle.exportKey("jwk", signingKeys.publicKey),
        purpose: "issuer-signing",
      },
      privateKey: signingKeys.privateKey,
    },
    {
      handle: "test:aes:key",
      key: encryptionKey,
      metadata: {
        algorithm: "A256GCM",
        createdAt: EpochMilliseconds.parse(1),
        keyId: "test-aes-key",
        purpose: "data-encryption",
      },
      nonce: new Uint8Array(12),
    },
  );
}

describe("opaque cryptographic values", () => {
  it("redacts stored password hashes while permitting explicit storage access", () => {
    const hash = PasswordHash.fromStorage(SYNTHETIC_HASH);

    expect(hash.encodedForStorage()).toBe(SYNTHETIC_HASH);
    expect(JSON.stringify(hash)).toBe('"[REDACTED PASSWORD HASH]"');
  });

  it.each(["", "x".repeat(MAX_STORED_PASSWORD_HASH_BYTES + 1), null, 1])(
    "rejects unsafe stored password hash %s",
    (value) => {
      expect(() => PasswordHash.fromStorage(value)).toThrow(TypeError);
    },
  );

  it("redacts key handles while permitting explicit adapter access", () => {
    const handle = KeyHandle.parse("kms:test/key-1");

    expect(handle.opaqueValue()).toBe("kms:test/key-1");
    expect(JSON.stringify(handle)).toBe('"[REDACTED KEY HANDLE]"');
  });

  it.each(["", "a", "x".repeat(201), "spaces are unsafe", null])(
    "rejects invalid key handle %s",
    (value) => {
      expect(() => KeyHandle.parse(value)).toThrow(TypeError);
    },
  );
});

describe("cryptographic capability vectors", () => {
  it("signs and verifies exact bytes with purpose-bound RS256 metadata", async () => {
    const adapter = await fixture();
    const payload = new TextEncoder().encode("signed payload");
    const signature = await adapter.sign({
      algorithm: "RS256",
      keyHandle: KeyHandle.parse("test:rsa:key"),
      keyId: "test-rsa-key",
      payload,
      purpose: "issuer-signing",
    });

    await expect(
      adapter.verify({
        key: adapter.signingMetadata(),
        payload,
        signature,
      }),
    ).resolves.toBe(true);
    payload[0] = 0;
    await expect(
      adapter.verify({
        key: adapter.signingMetadata(),
        payload,
        signature,
      }),
    ).resolves.toBe(false);
  });

  it("matches the NIST AES-256-GCM zero-key vector and authenticates AAD", async () => {
    const adapter = await fixture();
    const encrypted = await adapter.encrypt({
      additionalData: new Uint8Array(),
      algorithm: "A256GCM",
      keyHandle: KeyHandle.parse("test:aes:key"),
      keyId: "test-aes-key",
      plaintext: new Uint8Array(16),
      purpose: "data-encryption",
    });

    expect(hex(encrypted.ciphertext)).toBe(AES_GCM_VECTOR);
    await expect(
      adapter.decrypt({
        additionalData: new Uint8Array(),
        encrypted,
        keyHandle: KeyHandle.parse("test:aes:key"),
        purpose: "data-encryption",
      }),
    ).resolves.toEqual(new Uint8Array(16));
    await expect(
      adapter.decrypt({
        additionalData: new Uint8Array([1]),
        encrypted,
        keyHandle: KeyHandle.parse("test:aes:key"),
        purpose: "data-encryption",
      }),
    ).rejects.toThrow();
  });

  it("fails before cryptography when key purpose or handle does not match", async () => {
    const adapter = await fixture();

    await expect(
      adapter.sign({
        algorithm: "RS256",
        keyHandle: KeyHandle.parse("test:wrong:key"),
        keyId: "test-rsa-key",
        payload: new Uint8Array(),
        purpose: "issuer-signing",
      }),
    ).rejects.toThrow("metadata or purpose");
  });
});
