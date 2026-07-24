import { describe, expect, it, vi } from "vitest";
import { runSarifPolicyCommand, runSuppressionPolicyCommand } from "../src/security-command.js";

function sarif(level: "error" | "warning" = "warning"): string {
  return JSON.stringify({
    runs: [
      {
        results: [
          {
            level,
            locations: [{ physicalLocation: { artifactLocation: { uri: "src/example.ts" } } }],
            message: { text: "Sensitive scanner detail" },
            ruleId: "test-rule",
          },
        ],
        tool: { driver: { name: "test-tool" } },
      },
    ],
    version: "2.1.0",
  });
}

function suppressionRegistry(expiresOn = "2026-08-01"): string {
  return JSON.stringify({
    suppressions: [
      {
        compensatingControl: "An independent validation blocks the affected path.",
        createdOn: "2026-07-01",
        expiresOn,
        id: "sec-test-001",
        owner: "security@example.test",
        path: "src/example.ts",
        reason: "The scanner cannot understand the validated boundary.",
        ruleId: "test-rule",
        tool: "test-tool",
        trackingUrl: "https://example.test/SEC-1",
      },
    ],
    version: 1,
  });
}

function dependencies(report = sarif(), registry = '{"suppressions":[],"version":1}') {
  return {
    readText: vi.fn((path: string) => Promise.resolve(path.endsWith(".json") ? registry : report)),
    today: () => "2026-07-24",
    writeError: vi.fn<(message: string) => void>(),
    writeOutput: vi.fn<(message: string) => void>(),
  };
}

describe("security commands", () => {
  it("accepts a valid suppression registry", async () => {
    const deps = dependencies();
    expect(await runSuppressionPolicyCommand(deps)).toBe(0);
    expect(deps.writeOutput).toHaveBeenCalledOnce();
  });

  it("rejects expired suppressions", async () => {
    const deps = dependencies(sarif(), suppressionRegistry("2026-07-20"));
    expect(await runSuppressionPolicyCommand(deps)).toBe(1);
    expect(deps.writeError).toHaveBeenCalledWith(expect.stringContaining("expired"));
  });

  it("rejects invalid SARIF arguments", async () => {
    const invalidArguments: readonly (readonly string[])[] = [
      [],
      ["report.sarif"],
      ["", "commit"],
      ["report.sarif", "invalid"],
    ];

    for (const arguments_ of invalidArguments) {
      await expect(runSarifPolicyCommand(arguments_, dependencies())).rejects.toThrow();
    }
  });

  it("rejects an invalid registry before reading findings", async () => {
    const deps = dependencies(sarif(), suppressionRegistry("2026-07-20"));
    expect(await runSarifPolicyCommand(["report.sarif", "release"], deps)).toBe(1);
    expect(deps.readText).toHaveBeenCalledTimes(1);
  });

  it("emits a minimized report and blocks high findings", async () => {
    const deps = dependencies(sarif("error"));
    expect(await runSarifPolicyCommand(["report.sarif", "commit"], deps)).toBe(1);
    expect(deps.writeError).toHaveBeenCalledWith(expect.not.stringContaining("Sensitive"));
    expect(deps.writeOutput).toHaveBeenCalledWith(expect.stringContaining('"blocked":1'));
  });

  it("allows a suppressed medium finding and reports its identifier", async () => {
    const deps = dependencies(sarif(), suppressionRegistry());
    expect(await runSarifPolicyCommand(["report.sarif", "release"], deps)).toBe(0);
    expect(deps.writeOutput).toHaveBeenCalledWith(expect.stringContaining("sec-test-001"));
  });
});
