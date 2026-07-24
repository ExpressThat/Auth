import { describe, expect, it } from "vitest";
import {
  assertParserLimitCases,
  enforceJsonParserLimits,
  measureJsonDepth,
} from "../src/parser-harness.js";

describe("parser boundary harness", () => {
  it("accepts and rejects declared parser cases", () => {
    const parse = (input: string) => {
      if (input !== "accepted") {
        throw new Error("rejected");
      }
      return input;
    };

    expect(() =>
      assertParserLimitCases(
        [
          { expectation: "accept", input: "accepted", name: "valid" },
          { expectation: "reject", input: "hostile", name: "invalid" },
        ],
        parse,
      ),
    ).not.toThrow();
  });

  it("reports both expectation mismatches", () => {
    expect(() =>
      assertParserLimitCases(
        [{ expectation: "accept", input: "value", name: "false-negative" }],
        () => {
          throw new Error("rejected");
        },
      ),
    ).toThrow("rejected accepted");
    expect(() =>
      assertParserLimitCases(
        [{ expectation: "reject", input: "value", name: "false-positive" }],
        () => "accepted",
      ),
    ).toThrow("accepted hostile");
  });

  it("measures structure while ignoring quoted and escaped delimiters", () => {
    expect(measureJsonDepth('{"text":"[{\\"nested\\":true}]","items":[{}]}')).toBe(3);
    expect(measureJsonDepth("[]")).toBe(1);
    expect(measureJsonDepth("")).toBe(0);
    expect(measureJsonDepth("]")).toBe(Number.POSITIVE_INFINITY);
    expect(measureJsonDepth("[}")).toBe(Number.POSITIVE_INFINITY);
    expect(measureJsonDepth("[")).toBe(Number.POSITIVE_INFINITY);
    expect(measureJsonDepth('"unterminated')).toBe(Number.POSITIVE_INFINITY);
  });

  it("enforces configured length and nesting boundaries", () => {
    const limits = { maximumBytes: 10, maximumDepth: 2 };

    expect(() => enforceJsonParserLimits('{"a":[]}', limits)).not.toThrow();
    expect(() => enforceJsonParserLimits("x".repeat(11), limits)).toThrow("byte");
    expect(() => enforceJsonParserLimits('"é"', { maximumBytes: 3, maximumDepth: 1 })).toThrow(
      "byte",
    );
    expect(() => enforceJsonParserLimits("[[[]]]", limits)).toThrow("depth");
  });

  it.each([
    [{ maximumBytes: 0, maximumDepth: 1 }],
    [{ maximumBytes: Number.NaN, maximumDepth: 1 }],
    [{ maximumBytes: 1, maximumDepth: 0 }],
    [{ maximumBytes: 1, maximumDepth: Number.NaN }],
  ])("rejects invalid parser limits %#", (limits) => {
    expect(() => enforceJsonParserLimits("{}", limits)).toThrow(RangeError);
  });
});
