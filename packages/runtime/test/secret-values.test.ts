import { describe, expect, it } from "vitest";
import {
  MAX_SECRET_BYTES,
  SecretMaterial,
  SecretPurpose,
  SecretReference,
  SecretStorageError,
  SecretVersion,
} from "../src/index.js";

const CANARY_SECRET = "run004-canary-secret";

describe("secret values", () => {
  it("copies, redacts, and destroys secret material", () => {
    const source = new Uint8Array([1, 2, 3]);
    const material = SecretMaterial.fromBytes(source);
    source[0] = 9;
    const exposed = material.copyForProvider();
    exposed[1] = 9;

    expect(material.byteLength()).toBe(3);
    expect(material.copyForProvider()).toEqual(new Uint8Array([1, 2, 3]));
    expect(JSON.stringify(material)).toBe('"[REDACTED SECRET]"');
    material.destroy();
    material.destroy();
    expect(() => material.copyForProvider()).toThrow("destroyed");
  });

  it("accepts UTF-8 without exposing the original value", () => {
    const material = SecretMaterial.fromUtf8(CANARY_SECRET);

    expect(new TextDecoder().decode(material.copyForProvider())).toBe(CANARY_SECRET);
    expect(JSON.stringify(material)).not.toContain(CANARY_SECRET);
  });

  it.each([null, "bytes", new Uint8Array(), new Uint8Array(MAX_SECRET_BYTES + 1)])(
    "rejects invalid byte material",
    (value) => {
      expect(() => SecretMaterial.fromBytes(value)).toThrow(TypeError);
    },
  );

  it.each([null, "", "x".repeat(MAX_SECRET_BYTES + 1)])(
    "rejects invalid UTF-8 material",
    (value) => {
      expect(() => SecretMaterial.fromUtf8(value)).toThrow(TypeError);
    },
  );

  it("uses bounded purposes and redacted opaque references", () => {
    const purpose = SecretPurpose.parse("provider.email");
    const reference = SecretReference.parse("vault:tenant/secret-1");

    expect(purpose.identifier()).toBe("provider.email");
    expect(JSON.stringify(purpose)).toBe('"provider.email"');
    expect(reference.opaqueValue()).toBe("vault:tenant/secret-1");
    expect(JSON.stringify(reference)).toBe('"[REDACTED SECRET REFERENCE]"');
  });

  it.each(["", "ab", "contains spaces", "x".repeat(301), null])(
    "rejects invalid references %s",
    (value) => {
      expect(() => SecretReference.parse(value)).toThrow(TypeError);
    },
  );

  it.each(["", "ab", "contains spaces", "x".repeat(101), null])(
    "rejects invalid purposes %s",
    (value) => {
      expect(() => SecretPurpose.parse(value)).toThrow(TypeError);
    },
  );

  it("validates serializable positive versions", () => {
    const version = SecretVersion.parse(2);

    expect(version.numberValue()).toBe(2);
    expect(JSON.stringify(version)).toBe("2");
  });

  it.each([0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1", null])(
    "rejects invalid version %s",
    (value) => {
      expect(() => SecretVersion.parse(value)).toThrow(TypeError);
    },
  );

  it("uses stable redacted errors without secret or reference values", () => {
    const failure = new SecretStorageError("resolve", "unavailable");
    const serialized = JSON.stringify(failure);

    expect(failure.retryable).toBe(true);
    expect(failure.message).toBe("Secret storage resolve failed (unavailable).");
    expect(serialized).toBe('{"code":"unavailable","operation":"resolve","retryable":true}');
    expect(serialized).not.toContain(CANARY_SECRET);
    expect(new SecretStorageError("metadata", "not-found").retryable).toBe(false);
  });
});
