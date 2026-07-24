import { describe, expect, it } from "vitest";
import { runConcurrentAttempts, runReplayAttempts } from "../src/concurrency-harness.js";

describe("concurrency and replay drivers", () => {
  it("captures fulfilled and rejected concurrent attempts by index", async () => {
    const results = await runConcurrentAttempts(3, async (index) => {
      if (index === 1) {
        throw new Error("conflict");
      }
      return `value-${index}`;
    });

    expect(results).toEqual([
      { index: 0, status: "fulfilled", value: "value-0" },
      { error: expect.any(Error), index: 1, status: "rejected" },
      { index: 2, status: "fulfilled", value: "value-2" },
    ]);
  });

  it("reuses the exact input for every replay attempt", async () => {
    const input = Object.freeze({ idempotencyKey: "test-replay-key" });
    const results = await runReplayAttempts(2, input, async (selected, index) => ({
      index,
      sameInput: selected === input,
    }));

    expect(results).toEqual([
      { index: 0, status: "fulfilled", value: { index: 0, sameInput: true } },
      { index: 1, status: "fulfilled", value: { index: 1, sameInput: true } },
    ]);
  });

  it.each([[1], [Number.NaN], [1_001]])("rejects unsafe campaign size %s", async (attempts) => {
    await expect(runConcurrentAttempts(attempts, async () => undefined)).rejects.toThrow(
      RangeError,
    );
  });
});
