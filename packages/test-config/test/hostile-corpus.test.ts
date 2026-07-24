import { describe, expect, it } from "vitest";
import { createLimitCorpus, HOSTILE_TEXT_CORPUS } from "../src/hostile-corpus.js";

describe("hostile input corpora", () => {
  it("provides stable named cases across threat categories", () => {
    expect(HOSTILE_TEXT_CORPUS.map((testCase) => testCase.id)).toEqual([
      "nul",
      "bidi-override",
      "combining-mark",
      "lone-surrogate",
      "sql-control",
      "template-expression",
      "html-script",
      "path-traversal",
      "prototype-key",
      "header-split",
    ]);
    expect(new Set(HOSTILE_TEXT_CORPUS.map((testCase) => testCase.category))).toEqual(
      new Set(["encoding", "injection", "structure", "transport"]),
    );
  });

  it("creates exact over-depth and over-length boundaries", () => {
    expect(createLimitCorpus(4, 2)).toEqual([
      { category: "structure", id: "over-depth", value: "[[[0]]]" },
      { category: "structure", id: "over-length", value: "xxxxx" },
    ]);
  });

  it.each([
    [0, 1],
    [Number.NaN, 1],
    [1, 0],
    [1, Number.NaN],
  ])("rejects invalid corpus limits %#", (length, depth) => {
    expect(() => createLimitCorpus(length, depth)).toThrow(RangeError);
  });
});
