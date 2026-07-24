import { describe, expect, it } from "vitest";
import { KeyLifecycleVersion, KeyManagementError, KeyRingId } from "../src/index.js";

describe("key management values", () => {
  it("uses bounded key-ring identifiers", () => {
    const ring = KeyRingId.parse("issuer:ring/production");

    expect(ring.identifier()).toBe("issuer:ring/production");
  });

  it.each(["", "ab", "contains spaces", "x".repeat(201), null])(
    "rejects invalid key-ring identifier %s",
    (value) => {
      expect(() => KeyRingId.parse(value)).toThrow(TypeError);
    },
  );

  it("uses serializable non-negative lifecycle versions", () => {
    const version = KeyLifecycleVersion.parse(0);

    expect(version.numberValue()).toBe(0);
    expect(JSON.stringify(version)).toBe("0");
  });

  it.each([-1, 1.5, Number.MAX_SAFE_INTEGER + 1, "1", null])(
    "rejects invalid lifecycle version %s",
    (value) => {
      expect(() => KeyLifecycleVersion.parse(value)).toThrow(TypeError);
    },
  );

  it("normalizes errors without key metadata", () => {
    const unavailable = new KeyManagementError("sign", "unavailable");

    expect(unavailable.retryable).toBe(true);
    expect(unavailable.message).toBe("Key management sign failed (unavailable).");
    expect(JSON.stringify(unavailable)).toBe(
      '{"code":"unavailable","operation":"sign","retryable":true}',
    );
    expect(new KeyManagementError("publish", "not-found").retryable).toBe(false);
  });
});
