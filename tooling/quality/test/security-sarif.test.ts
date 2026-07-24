import { describe, expect, it } from "vitest";
import { decodeSarifFindings } from "../src/security-sarif.js";

function result(
  ruleId: string,
  level?: "error" | "none" | "note" | "warning",
  score?: number | string,
) {
  return {
    ...(level === undefined ? {} : { level }),
    locations: [
      {
        physicalLocation: {
          artifactLocation: { uri: `src/${ruleId}.ts` },
        },
      },
    ],
    message: { text: `Finding ${ruleId}` },
    ...(score === undefined ? {} : { properties: { "security-severity": score } }),
    ruleId,
  };
}

function sarif(
  results?: readonly ReturnType<typeof result>[],
  extraRuns: readonly object[] = [],
): string {
  return JSON.stringify({
    runs: [
      {
        ...(results === undefined ? {} : { results }),
        tool: { driver: { name: "Synthetic Scanner" } },
      },
      ...extraRuns,
    ],
    version: "2.1.0",
  });
}

describe("SARIF security findings", () => {
  it("decodes scores and fallback levels into stable severities", () => {
    const findings = decodeSarifFindings(
      sarif([
        result("critical", "none", 9.8),
        result("high", "none", "7.2"),
        result("medium-score", "none", 4),
        result("low-score", "none", 0.1),
        result("zero-score", "none", 0),
        result("bad-score", "error", "not-a-number"),
        result("high-level", "error"),
        result("medium-level", "warning"),
        result("low-level", "note"),
        result("info-level", "none"),
        result("missing-level"),
      ]),
    );
    const severities = new Map(findings.map((finding) => [finding.ruleId, finding.severity]));

    expect(severities).toEqual(
      new Map([
        ["bad-score", "high"],
        ["critical", "critical"],
        ["high", "high"],
        ["high-level", "high"],
        ["info-level", "info"],
        ["low-level", "low"],
        ["low-score", "low"],
        ["medium-level", "medium"],
        ["medium-score", "medium"],
        ["missing-level", "info"],
        ["zero-score", "info"],
      ]),
    );
  });

  it("accepts a run with no results", () => {
    expect(decodeSarifFindings(sarif())).toEqual([]);
  });

  it("sorts by tool, path, and rule identifier", () => {
    const source = sarif(
      [result("z"), result("a")],
      [
        {
          results: [result("first")],
          tool: { driver: { name: "Another Scanner" } },
        },
      ],
    );

    expect(decodeSarifFindings(source).map((finding) => finding.ruleId)).toEqual([
      "first",
      "a",
      "z",
    ]);
  });

  it("sorts equal tools by path before rule identifier", () => {
    const source = JSON.stringify({
      runs: [
        {
          results: [
            result("same", "none"),
            {
              ...result("z", "none"),
              locations: [{ physicalLocation: { artifactLocation: { uri: "src/earlier.ts" } } }],
            },
            {
              ...result("a", "none"),
              locations: [{ physicalLocation: { artifactLocation: { uri: "src/same.ts" } } }],
            },
          ],
          tool: { driver: { name: "Synthetic Scanner" } },
        },
      ],
      version: "2.1.0",
    });

    expect(decodeSarifFindings(source).map((finding) => finding.ruleId)).toEqual([
      "z",
      "a",
      "same",
    ]);
  });

  it("rejects malformed reports", () => {
    expect(() => decodeSarifFindings('{"version":"2.0.0","runs":[]}')).toThrow();
  });
});
