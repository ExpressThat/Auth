import { argon2id } from "@noble/hashes/argon2.js";
import { describe, expect, it } from "vitest";
import { nodeHash, nodeVerify } from "../src/node.ts";
import { ARGON2_POLICY, MAX_PASSWORD_BYTES } from "../src/policy.ts";
import { portableHash, portableVerify } from "../src/portable.ts";

const PASSWORD = "correct horse battery staple 🐎";
const SALT = Uint8Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
const ENCODED_SALT = "AAECAwQFBgcICQoLDA0ODw";
const ENCODED_32_ZERO_BYTES = "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";

describe("Argon2id adapters", () => {
  it("matches the Argon2id RFC 9106 test vector", () => {
    const output = argon2id(new Uint8Array(32).fill(1), new Uint8Array(16).fill(2), {
      t: 3,
      m: 32,
      p: 4,
      version: 0x13,
      dkLen: 32,
      key: new Uint8Array(8).fill(3),
      personalization: new Uint8Array(12).fill(4),
    });
    const outputHex = Array.from(output, (byte) => byte.toString(16).padStart(2, "0")).join("");

    // biome-ignore lint/security/noSecrets: public RFC 9106 test vector
    expect(outputHex).toBe("0d640df58d78766c08c037a34a8b53c9d01ef0452d75b65eb52520e96b01e659");
  });

  it("creates a versioned PHC string with the approved parameters", async () => {
    const encoded = await portableHash(PASSWORD, SALT);

    expect(encoded).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$[A-Za-z0-9+/]+\$[A-Za-z0-9+/]+$/);
    await expect(portableVerify(encoded, PASSWORD)).resolves.toBe(true);
    await expect(portableVerify(encoded, "incorrect")).resolves.toBe(false);
  });

  it("cross-verifies portable hashes with the Node adapter", async () => {
    const encoded = await portableHash(PASSWORD, SALT);

    await expect(nodeVerify(encoded, PASSWORD)).resolves.toBe(true);
  });

  it("cross-verifies Node hashes with the portable adapter", async () => {
    const startedAt = performance.now();
    const encoded = await nodeHash(PASSWORD);
    const elapsedMs = performance.now() - startedAt;

    await expect(portableVerify(encoded, PASSWORD)).resolves.toBe(true);
    expect(elapsedMs).toBeLessThan(1_000);
  });

  it("uses the approved policy and rejects excessive input", async () => {
    expect(ARGON2_POLICY).toMatchObject({
      memoryKiB: 19_456,
      iterations: 2,
      parallelism: 1,
      saltBytes: 16,
      hashBytes: 32,
    });

    await expect(portableHash("x".repeat(MAX_PASSWORD_BYTES + 1), SALT)).rejects.toThrow(
      "Password exceeds the hashing input limit.",
    );
    await expect(portableHash(PASSWORD, new Uint8Array(15))).rejects.toThrow(
      "Argon2id salts must contain exactly 16 bytes.",
    );
  });

  // biome-ignore-start lint/security/noSecrets: deliberately malformed non-secret PHC fixtures
  it.each([
    "not-a-phc-string",
    "$argon2id$v=16$m=19456,t=2,p=1$AA$AA",
    "$argon2id$v=19$m=1,t=2,p=1$AA$AA",
    "$argon2id$v=19$m=19456,t=1,p=1$AA$AA",
    "$argon2id$v=19$m=19456,t=2,p=2$AA$AA",
    `$argon2id$v=19$m=19456,t=2,p=1$AA$${ENCODED_32_ZERO_BYTES}`,
    `$argon2id$v=19$m=19456,t=2,p=1$${ENCODED_SALT}$AA`,
    "$argon2id$v=19$m=19456,t=2,p=1$A$A",
  ])("rejects unsupported or malformed PHC input: %s", async (encoded) => {
    await expect(portableVerify(encoded, PASSWORD)).resolves.toBe(false);
  });
  // biome-ignore-end lint/security/noSecrets: deliberately malformed non-secret PHC fixtures
});
