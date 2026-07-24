import { resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";

afterEach(() => {
  process.argv = process.argv.slice(0, 2);
  process.exitCode = undefined;
  vi.restoreAllMocks();
  vi.resetModules();
  vi.doUnmock("../src/security-command.js");
});

describe("security command entry points", () => {
  it("wires suppression policy dependencies", async () => {
    const run = vi.fn(async (dependencies) => {
      await dependencies.readText(".security/suppressions.json");
      dependencies.today();
      dependencies.writeError("synthetic error");
      dependencies.writeOutput("synthetic output");
      return 0;
    });
    vi.doMock("../src/security-command.js", () => ({ runSuppressionPolicyCommand: run }));
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await import("../src/check-security-suppressions.js");

    expect(run).toHaveBeenCalledOnce();
    expect(process.exitCode).toBe(0);
  });

  it("wires relative SARIF paths and command arguments", async () => {
    const run = vi.fn(async (arguments_, dependencies) => {
      await dependencies.readText(arguments_[0]);
      dependencies.today();
      dependencies.writeError("synthetic error");
      dependencies.writeOutput("synthetic output");
      return 0;
    });
    vi.doMock("../src/security-command.js", () => ({ runSarifPolicyCommand: run }));
    vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    process.argv = [...process.argv, "--", ".security/suppressions.json", "commit"];

    await import("../src/check-security-sarif.js");

    expect(run).toHaveBeenCalledWith([".security/suppressions.json", "commit"], expect.any(Object));
    expect(process.exitCode).toBe(0);
  });

  it("accepts absolute SARIF paths", async () => {
    const run = vi.fn(async (_arguments, dependencies) => {
      await dependencies.readText(resolve("package.json"));
      return 0;
    });
    vi.doMock("../src/security-command.js", () => ({ runSarifPolicyCommand: run }));
    process.argv = [...process.argv, "unused.sarif", "commit"];

    await import("../src/check-security-sarif.js");

    expect(process.exitCode).toBe(0);
  });

  it("fails closed without leaking parser details", async () => {
    vi.doMock("../src/security-command.js", () => ({
      runSarifPolicyCommand: () => Promise.reject(new Error("sensitive detail")),
    }));
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    process.argv = [...process.argv, "invalid.sarif", "commit"];

    await import("../src/check-security-sarif.js");

    expect(write).toHaveBeenCalledWith("Security report could not be evaluated safely.\n");
    expect(process.exitCode).toBe(1);
  });
});
