import { describe, expect, it, vi } from "vitest";
import {
  combineLicenseOutput,
  defaultLicenseCommandDependencies,
  type LicenseCommandDependencies,
  listWorkspaceLicenses,
  runLicenseCommand,
} from "../src/license-command.js";

function dependencies(
  overrides: Partial<LicenseCommandDependencies> = {},
): LicenseCommandDependencies {
  return {
    findViolations: vi.fn(() => []),
    listLicenses: vi.fn(() => ({ output: "{}", status: 0 })),
    stderr: { write: vi.fn() },
    stdout: { write: vi.fn() },
    ...overrides,
  };
}

describe("licence-policy command", () => {
  it("combines optional process output", () => {
    expect(combineLicenseOutput("out", "err")).toBe("outerr");
    expect(combineLicenseOutput(null, null)).toBe("");
  });

  it("reports a passing inventory", () => {
    const command = dependencies();

    expect(runLicenseCommand("repository", command)).toBe(0);
    expect(command.stdout.write).toHaveBeenCalledWith(
      "Dependency licences satisfy the reviewed policy.\n",
    );
  });

  it("reports every violation", () => {
    const command = dependencies({
      findViolations: vi.fn(() => [
        { license: "GPL", package: "a", reason: "not allowed", version: "1" },
        { license: "Unknown", package: "b", reason: "not known", version: "2" },
      ]),
    });

    expect(runLicenseCommand("repository", command)).toBe(1);
    expect(command.stderr.write).toHaveBeenCalledTimes(2);
  });

  it.each([
    [
      dependencies({ listLicenses: () => ({ output: "audit unavailable", status: 1 }) }),
      "Unable to inventory dependency licences: audit unavailable\n",
    ],
    [
      dependencies({
        findViolations: () => {
          throw "failure";
        },
      }),
      "Unknown licence-policy failure.\n",
    ],
  ])("reports inventory failures without dependency data", (command, expected) => {
    expect(runLicenseCommand("repository", command)).toBe(1);
    expect(command.stderr.write).toHaveBeenCalledWith(expected);
  });

  it("provides an injectable process-backed inventory boundary", () => {
    const run = vi.fn(() => ({ stderr: null, stdout: "inventory", status: 0 }));
    const command = defaultLicenseCommandDependencies(run);
    const result = command.listLicenses("repository");

    expect(command.findViolations).toBeTypeOf("function");
    expect(command.stderr).toBe(process.stderr);
    expect(command.stdout).toBe(process.stdout);
    expect(result.status).toBe(0);
    expect(result.output).toBe("inventory");
    expect(run).toHaveBeenCalledWith("pnpm licenses list --json", {
      cwd: "repository",
      encoding: "utf8",
      shell: true,
    });
  });

  it("constructs the default inventory dependency without executing it", () => {
    const command = defaultLicenseCommandDependencies();
    const run = vi.fn(() => ({ stderr: "", stdout: "{}", status: 0 }));

    expect(listWorkspaceLicenses("repository", run)).toEqual({ output: "{}", status: 0 });
    expect(command.listLicenses).toBeTypeOf("function");
  });
});
