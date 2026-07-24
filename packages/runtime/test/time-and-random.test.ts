import { describe, expect, it } from "vitest";
import {
  type Clock,
  EpochMilliseconds,
  MAX_EPOCH_MILLISECONDS,
  MAX_RANDOM_BYTES,
  type RandomSource,
  SystemClock,
  WebCryptoRandomSource,
} from "../src/index.js";
import { ControlledClock, SequenceRandomSource } from "../src/testing.js";

function verifyClock(clock: Clock): void {
  const value = clock.now();
  expect(value).toBeInstanceOf(EpochMilliseconds);
  expect(Number.isSafeInteger(Number(value))).toBe(true);
}

function verifyRandomSource(source: RandomSource): void {
  for (const length of [1, 16, 32, 257]) {
    const value = source.bytes(length);
    expect(value).toBeInstanceOf(Uint8Array);
    expect(value).toHaveLength(length);
  }
}

describe("epoch millisecond clock", () => {
  it("applies the shared contract to production and deterministic clocks", () => {
    verifyClock(new SystemClock());
    verifyClock(new ControlledClock(10));
  });

  it("accepts and round-trips supported integer instants", () => {
    const first = EpochMilliseconds.parse(1);
    const second = EpochMilliseconds.parse(2);

    expect(Number(first)).toBe(1);
    expect(first.toJSON()).toBe(1);
    expect(first.compare(second)).toBe(-1);
    expect(second.compare(first)).toBe(1);
    expect(first.compare(EpochMilliseconds.parse(1))).toBe(0);
    expect(EpochMilliseconds.parse(MAX_EPOCH_MILLISECONDS).valueOf()).toBe(MAX_EPOCH_MILLISECONDS);
  });

  it.each([
    undefined,
    "1",
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -1,
    0.5,
    MAX_EPOCH_MILLISECONDS + 1,
  ])("rejects unsupported instant %s", (value) => {
    expect(() => EpochMilliseconds.parse(value)).toThrow(RangeError);
  });

  it("reads a current supported instant from the system clock", () => {
    const before = Date.now();
    const value = Number(new SystemClock().now());
    const after = Date.now();

    expect(value).toBeGreaterThanOrEqual(before);
    expect(value).toBeLessThanOrEqual(after);
  });

  it("supports deterministic set and advance operations", () => {
    const clock = new ControlledClock(100);

    clock.advance(25);
    expect(Number(clock.now())).toBe(125);
    clock.set(10);
    expect(Number(clock.now())).toBe(10);
  });

  it.each([-1, 0.5, Number.MAX_SAFE_INTEGER])(
    "rejects an unsafe deterministic advance of %s",
    (value) => {
      const clock = new ControlledClock(MAX_EPOCH_MILLISECONDS);
      expect(() => clock.advance(value)).toThrow(RangeError);
    },
  );
});

describe("random sources", () => {
  it("satisfies the byte-source contract with Web Crypto", () => {
    const source = new WebCryptoRandomSource();
    verifyRandomSource(source);
    expect(source.bytes(MAX_RANDOM_BYTES)).toHaveLength(MAX_RANDOM_BYTES);
    expect(source.bytes(32)).not.toEqual(source.bytes(32));
  });

  it("satisfies the same contract with deterministic values", () => {
    const source = new SequenceRandomSource([
      new Uint8Array(1),
      new Uint8Array(16),
      new Uint8Array(32),
      new Uint8Array(257),
    ]);

    verifyRandomSource(source);
    expect(source.remaining()).toBe(0);
  });

  it.each([0, -1, 1.5, MAX_RANDOM_BYTES + 1])(
    "rejects invalid byte length %s in every implementation",
    (length) => {
      expect(() => new WebCryptoRandomSource().bytes(length)).toThrow(RangeError);
      expect(() => new SequenceRandomSource([]).bytes(length)).toThrow(RangeError);
    },
  );

  it("copies deterministic inputs and outputs", () => {
    const input = new Uint8Array([1, 2]);
    const source = new SequenceRandomSource([input]);
    input[0] = 9;
    const output = source.bytes(2);
    output[1] = 9;

    expect(output[0]).toBe(1);
    expect(source.remaining()).toBe(0);
  });

  it("rejects exhaustion and mismatched deterministic lengths", () => {
    expect(() => new SequenceRandomSource([]).bytes(1)).toThrow("exhausted");
    expect(() => new SequenceRandomSource([new Uint8Array(2)]).bytes(1)).toThrow(
      "Expected 1 deterministic bytes, received 2.",
    );
  });
});
