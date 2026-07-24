import { describe, expect, it } from "vitest";
import { ControlledClock, SequenceRandom } from "../src/index.js";

describe("ControlledClock", () => {
  it("controls, advances, and replaces the current instant", () => {
    const clock = new ControlledClock(100);

    expect(clock.now()).toBe(100);
    clock.advance(25);
    expect(clock.now()).toBe(125);
    clock.set(500);
    expect(clock.now()).toBe(500);
  });

  it.each([-1, 1.5, Number.POSITIVE_INFINITY])("rejects invalid initial time %s", (value) => {
    expect(() => new ControlledClock(value)).toThrow(RangeError);
  });

  it("defaults to the Unix epoch and rejects invalid changes or overflow", () => {
    const clock = new ControlledClock();

    expect(clock.now()).toBe(0);
    expect(() => clock.advance(-1)).toThrow("Clock advance");
    expect(() => clock.set(1.5)).toThrow("Clock time");
    clock.set(Number.MAX_SAFE_INTEGER);
    expect(() => clock.advance(1)).toThrow("Advanced time");
  });
});

describe("SequenceRandom", () => {
  it("returns defensive copies in the configured order", () => {
    const original = new Uint8Array([1, 2]);
    const random = new SequenceRandom([original, new Uint8Array()]);
    original[0] = 9;

    const first = random.bytes(2);
    expect(first).toEqual(new Uint8Array([1, 2]));
    first[0] = 8;
    expect(random.remaining()).toBe(1);
    expect(random.bytes(0)).toEqual(new Uint8Array());
    expect(random.remaining()).toBe(0);
  });

  it("rejects invalid lengths, mismatches, and exhaustion", () => {
    const random = new SequenceRandom([new Uint8Array([1])]);

    expect(() => random.bytes(-1)).toThrow("Random byte length");
    expect(() => random.bytes(2)).toThrow("Expected 2 deterministic bytes");
    expect(random.bytes(1)).toEqual(new Uint8Array([1]));
    expect(() => random.bytes(1)).toThrow("exhausted");
  });
});
