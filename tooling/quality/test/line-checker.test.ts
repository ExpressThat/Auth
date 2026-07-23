import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { countPhysicalLines, findLineViolations } from "../src/line-checker.js";

function lines(count: number): Buffer {
  return Buffer.from(Array.from({ length: count }, () => "line").join("\n"));
}

describe("physical line counting", () => {
  it.each([
    ["", 0],
    ["one", 1],
    ["one\n", 1],
    ["one\ntwo", 2],
    ["one\r\ntwo\r\n", 2],
    ["one\rtwo", 2],
    ["one\n\n", 2],
  ])("counts %j as %i lines", (content, expected) => {
    expect(countPhysicalLines(content)).toBe(expected);
  });
});

describe("line violations", () => {
  it("allows files at the limit and reports sorted files above it", () => {
    const violations = findLineViolations([
      { content: lines(251), path: "z.ts" },
      { content: lines(250), path: "allowed.ts" },
      { content: lines(300), path: "a.ts" },
    ]);

    expect(violations).toEqual([
      { actualLines: 300, maximumLines: 250, path: "a.ts" },
      { actualLines: 251, maximumLines: 250, path: "z.ts" },
    ]);
  });

  it("ignores exempt files even when they exceed the limit", () => {
    expect(findLineViolations([{ content: lines(300), path: "docs/design.md" }])).toEqual([]);
  });
});
