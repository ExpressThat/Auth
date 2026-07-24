import { describe, expect, it } from "vitest";
import { assertRedactedOutput } from "../src/redaction-harness.js";
import { SyntheticSecret } from "../src/synthetic-secret.js";

describe("redaction assertions", () => {
  it("accepts explicit redaction without exposing the canary", () => {
    const secret = new SyntheticSecret("token", 1);

    expect(assertRedactedOutput({ token: secret }, [secret])).toContain("[REDACTED]");
  });

  it("can check absence only when no marker is expected", () => {
    const secret = new SyntheticSecret("token", 2);

    expect(
      assertRedactedOutput({ status: "safe" }, [secret], { requireRedactionMarker: false }),
    ).toBe('{"status":"safe"}');
  });

  it("rejects leaks, missing markers, absent output, and cyclic diagnostics", () => {
    const secret = new SyntheticSecret("token", 3);
    const cyclic: { self?: unknown } = {};
    cyclic.self = cyclic;

    expect(() => assertRedactedOutput({ token: secret.revealForTest() }, [secret])).toThrow(
      "contains a synthetic secret",
    );
    expect(() => assertRedactedOutput({ status: "safe" }, [secret])).toThrow(
      "does not contain an explicit",
    );
    expect(() => assertRedactedOutput(undefined, [secret])).toThrow("serialized representation");
    expect(() => assertRedactedOutput(cyclic, [secret])).toThrow("safely serializable");
  });
});
