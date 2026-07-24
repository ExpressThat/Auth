import { describe, expect, it } from "vitest";
import { SyntheticSecret } from "../src/synthetic-secret.js";

describe("synthetic secrets", () => {
  it("requires an explicit reveal and serializes only redacted metadata", () => {
    const secret = new SyntheticSecret("api-key", 7);
    const revealed = secret.revealForTest();
    const serialized = JSON.stringify({ secret });

    expect(revealed).toMatch(/^test-only-api-key-000007-/u);
    expect(serialized).not.toContain(revealed);
    expect(JSON.parse(serialized)).toEqual({
      secret: {
        fingerprint: "test-api-key-000007",
        kind: "api-key",
        redactedValue: "[REDACTED]",
      },
    });
  });
});
