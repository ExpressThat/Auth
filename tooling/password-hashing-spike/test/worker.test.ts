import { describe, expect, it } from "vitest";
import { portableHash, portableVerify } from "../src/portable.ts";

describe("Workers Argon2id baseline", () => {
  it("hashes and verifies inside Workerd", async () => {
    const salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    const startedAt = performance.now();
    const encoded = await portableHash("workers-compatible password", salt);
    const elapsedMs = performance.now() - startedAt;

    await expect(portableVerify(encoded, "workers-compatible password")).resolves.toBe(true);
    expect(elapsedMs).toBeLessThan(2_000);
  });
});
