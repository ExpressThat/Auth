import { describe, expect, it } from "vitest";
import { KeyHandle, SecretMaterial } from "../src/index.js";
import { keyFixture } from "./key-test-fixture.js";

// biome-ignore lint/security/noSecrets: public NIST AES-256-GCM test vector.
const AES_GCM_VECTOR = "cea7403d4d606b6e074ec5d3baf39d18d0d1c8a799996bf0265b98b5d48ab919";

function hex(bytes: Uint8Array): string {
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("key wrapping conformance", () => {
  it("matches AES-256-GCM, unwraps, and authenticates context", async () => {
    const { adapter } = await keyFixture();
    const wrapped = await adapter.wrap({
      additionalData: new Uint8Array(),
      material: SecretMaterial.fromBytes(new Uint8Array(16)),
      purpose: "data-encryption",
      wrappingKeyHandle: KeyHandle.parse("test:wrapping/key"),
      wrappingKeyId: "test-wrapping-key",
    });

    expect(hex(wrapped.ciphertext)).toBe(AES_GCM_VECTOR);
    const unwrapped = await adapter.unwrap({
      additionalData: new Uint8Array(),
      purpose: "data-encryption",
      wrapped,
      wrappingKeyHandle: KeyHandle.parse("test:wrapping/key"),
    });
    expect(unwrapped.copyForProvider()).toEqual(new Uint8Array(16));
    await expect(
      adapter.unwrap({
        additionalData: new Uint8Array([1]),
        purpose: "data-encryption",
        wrapped,
        wrappingKeyHandle: KeyHandle.parse("test:wrapping/key"),
      }),
    ).rejects.toMatchObject({ code: "integrity-failure" });
  });

  it("binds wrapping handles, identifiers, and purposes", async () => {
    const { adapter } = await keyFixture();
    const base = {
      additionalData: new Uint8Array(),
      material: SecretMaterial.fromBytes(new Uint8Array(1)),
      purpose: "data-encryption" as const,
      wrappingKeyHandle: KeyHandle.parse("test:wrapping/key"),
      wrappingKeyId: "test-wrapping-key",
    };

    await expect(
      adapter.wrap({ ...base, wrappingKeyHandle: KeyHandle.parse("test:wrong/key") }),
    ).rejects.toMatchObject({ code: "purpose-mismatch" });
    await expect(adapter.wrap({ ...base, wrappingKeyId: "wrong-key" })).rejects.toMatchObject({
      code: "purpose-mismatch",
    });
    await expect(adapter.wrap({ ...base, purpose: "credential-pepper" })).rejects.toMatchObject({
      code: "purpose-mismatch",
    });
  });
});
