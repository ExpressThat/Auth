import { describe, expect, it, vi } from "vitest";
import { DeterministicRandom, runPropertyCampaign } from "../src/property-harness.js";

describe("deterministic property harness", () => {
  it("replays the same generated sequence from a seed", () => {
    const first = new DeterministicRandom(42);
    const second = new DeterministicRandom(42);
    const sequence = (random: DeterministicRandom) => [
      random.integer(-10, 10),
      random.pick(["a", "b", "c"]),
      random.text(8),
    ];

    expect(sequence(first)).toEqual(sequence(second));
  });

  it("runs a bounded campaign with seed and iteration context", () => {
    const property = vi.fn();

    runPropertyCampaign({ iterations: 3, property, seed: 7 });

    expect(property).toHaveBeenCalledTimes(3);
    expect(property).toHaveBeenNthCalledWith(3, expect.objectContaining({ iteration: 2, seed: 7 }));
  });

  it.each([[0], [Number.NaN], [0x1_0000_0000]])("rejects invalid seeds %#", (seed) => {
    expect(() => new DeterministicRandom(seed)).toThrow(RangeError);
  });

  it("rejects invalid integer ranges, corpora, and text settings", () => {
    const random = new DeterministicRandom(1);

    expect(() => random.integer(Number.NaN, 1)).toThrow(RangeError);
    expect(() => random.integer(1, Number.NaN)).toThrow(RangeError);
    expect(() => random.integer(2, 1)).toThrow(RangeError);
    expect(() => random.integer(Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER)).toThrow(
      RangeError,
    );
    expect(() => random.pick([])).toThrow(RangeError);
    expect(() => random.pick(new Array<string>(1))).toThrow("selection failed");
    expect(() => random.text(Number.NaN)).toThrow(RangeError);
    expect(() => random.text(-1)).toThrow(RangeError);
    expect(() => random.text(1, "")).toThrow(RangeError);
  });

  it.each([[0], [Number.NaN], [100_001]])("rejects invalid campaign sizes %#", (iterations) => {
    expect(() => runPropertyCampaign({ iterations, property: () => undefined, seed: 1 })).toThrow(
      RangeError,
    );
  });

  it.each([
    [new Error("invariant"), "invariant"],
    ["failure", "unknown property failure"],
  ])("reports a replayable failure without generated input", (failure, message) => {
    expect(() =>
      runPropertyCampaign({
        iterations: 1,
        property: () => {
          throw failure;
        },
        seed: 99,
      }),
    ).toThrow(`seed 99 at iteration 0: ${message}`);
  });
});
