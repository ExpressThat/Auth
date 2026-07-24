import { describe, expect, it, vi } from "vitest";
import { type BoundaryCommandDependencies, runBoundaryCommand } from "../src/boundary-command.js";

function dependencies(
  overrides: Partial<BoundaryCommandDependencies> = {},
): BoundaryCommandDependencies {
  return {
    findViolations: vi.fn(async () => []),
    readFiles: vi.fn(async () => []),
    stderr: { write: vi.fn() },
    stdout: { write: vi.fn() },
    ...overrides,
  };
}

describe("boundary-policy command", () => {
  it("reports a passing repository", async () => {
    const command = dependencies();

    await expect(runBoundaryCommand("repository", command)).resolves.toBe(0);
    expect(command.stdout.write).toHaveBeenCalledWith(
      "Workspace dependencies and imports satisfy the boundary policy.\n",
    );
  });

  it("reports every boundary violation", async () => {
    const command = dependencies({
      findViolations: vi.fn(async () => [
        { code: "undeclared-internal-import", message: "Missing dependency.", path: "src/app.ts" },
        { code: "package-cycle", message: "Cycle detected.", path: "package.json" },
      ]),
    });

    await expect(runBoundaryCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledTimes(2);
  });

  it.each([
    [new Error("parse failed"), "parse failed\n"],
    ["failure", "Unknown boundary-policy failure.\n"],
  ])("redacts a check failure", async (failure, expected) => {
    const command = dependencies({
      findViolations: vi.fn(async () => Promise.reject(failure)),
    });

    await expect(runBoundaryCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledWith(expected);
  });
});
