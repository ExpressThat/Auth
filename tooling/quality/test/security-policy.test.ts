import { describe, expect, it } from "vitest";
import type {
  SecurityFinding,
  SecuritySuppression,
  SecuritySuppressionRegistry,
} from "../src/security-model.js";
import {
  decodeSecuritySuppressions,
  evaluateSecurityFindings,
  findSuppressionViolations,
} from "../src/security-policy.js";

function suppression(overrides: Partial<SecuritySuppression> = {}): SecuritySuppression {
  return {
    compensatingControl: "The affected path has an independent denial control.",
    createdOn: "2026-07-01",
    expiresOn: "2026-07-31",
    id: "sec-test-001",
    owner: "security@example.test",
    path: "src/example.ts",
    reason: "The scanner cannot understand the validated wrapper.",
    ruleId: "test-rule",
    tool: "test-tool",
    trackingUrl: "https://example.test/security/SEC-1",
    ...overrides,
  };
}

function registry(...suppressions: SecuritySuppression[]): SecuritySuppressionRegistry {
  return { suppressions, version: 1 };
}

function finding(
  severity: SecurityFinding["severity"],
  overrides: Partial<SecurityFinding> = {},
): SecurityFinding {
  return {
    message: "Safe synthetic finding",
    path: "src/example.ts",
    ruleId: "test-rule",
    severity,
    tool: "test-tool",
    ...overrides,
  };
}

describe("security suppression registry", () => {
  it("decodes a narrow, expiring suppression", () => {
    const decoded = decodeSecuritySuppressions(
      JSON.stringify({ suppressions: [suppression()], version: 1 }),
    );

    expect(decoded.suppressions).toHaveLength(1);
  });

  it.each([
    [{ suppressions: [], version: 2 }, "Invalid input"],
    [{ suppressions: [suppression({ path: "src/*" })], version: 1 }, "wildcards are prohibited"],
    [{ suppressions: [suppression({ reason: "short" })], version: 1 }, "Too small"],
  ])("rejects an invalid registry", (value, message) => {
    expect(() => decodeSecuritySuppressions(JSON.stringify(value))).toThrow(message);
  });

  it("accepts active, unique suppressions", () => {
    expect(findSuppressionViolations(registry(suppression()), "2026-07-24")).toEqual([]);
  });

  it("rejects duplicate identifiers and scopes", () => {
    const violations = findSuppressionViolations(
      registry(suppression(), suppression({ id: "sec-test-002" })),
      "2026-07-24",
    );

    expect(violations).toContain("duplicate suppression scope test-tool/test-rule");
  });

  it("rejects a duplicate identifier on another scope", () => {
    const violations = findSuppressionViolations(
      registry(suppression(), suppression({ path: "src/other.ts" })),
      "2026-07-24",
    );

    expect(violations).toContain("duplicate suppression id sec-test-001");
  });

  it.each([
    [
      suppression({ expiresOn: "2026-07-01" }),
      "suppression sec-test-001 must expire after creation",
    ],
    [
      suppression({ expiresOn: "2026-10-01" }),
      "suppression sec-test-001 exceeds the 90-day maximum",
    ],
    [suppression({ expiresOn: "2026-07-20" }), "suppression sec-test-001 expired on 2026-07-20"],
  ])("rejects invalid time bounds", (item, expected) => {
    expect(findSuppressionViolations(registry(item), "2026-07-24")).toContain(expected);
  });
});

describe("security severity gates", () => {
  it("blocks high and critical findings at the commit gate", () => {
    const severities: readonly SecurityFinding["severity"][] = [
      "critical",
      "high",
      "medium",
      "low",
      "info",
    ];
    const decisions = evaluateSecurityFindings(
      severities.map((severity) => finding(severity, { ruleId: severity })),
      registry(),
      "commit",
    );

    expect(decisions.map(({ blocked }) => blocked)).toEqual([true, true, false, false, false]);
  });

  it("also blocks medium findings at the release gate", () => {
    expect(evaluateSecurityFindings([finding("medium")], registry(), "release")[0]?.blocked).toBe(
      true,
    );
  });

  it("allows a matching medium suppression but never a high suppression", () => {
    const decisions = evaluateSecurityFindings(
      [finding("medium"), finding("high")],
      registry(suppression()),
      "release",
    );

    expect(decisions).toMatchObject([
      { blocked: false, suppressionId: "sec-test-001" },
      { blocked: true, suppressionId: "sec-test-001" },
    ]);
  });

  it("does not apply a suppression outside its exact scope", () => {
    const [decision] = evaluateSecurityFindings(
      [finding("medium", { path: "src/other.ts" })],
      registry(suppression()),
      "release",
    );

    expect(decision).toMatchObject({ blocked: true });
    expect(decision).not.toHaveProperty("suppressionId");
  });
});
