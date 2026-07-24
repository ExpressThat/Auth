import { describe, expect, it, vi } from "vitest";
import { type LineCommandDependencies, runLineCommand } from "../src/line-command.js";

function dependencies(overrides: Partial<LineCommandDependencies> = {}): LineCommandDependencies {
  return {
    findViolations: vi.fn(() => []),
    readFiles: vi.fn(async () => []),
    stderr: { write: vi.fn() },
    stdout: { write: vi.fn() },
    ...overrides,
  };
}

describe("line-policy command", () => {
  it("reports a passing repository", async () => {
    const command = dependencies();

    await expect(runLineCommand("repository", command)).resolves.toBe(0);
    expect(command.stdout.write).toHaveBeenCalledWith(
      "First-party files satisfy the 250-line policy.\n",
    );
  });

  it("reports every line violation", async () => {
    const command = dependencies({
      findViolations: vi.fn(() => [
        { actualLines: 251, maximumLines: 250, path: "src/large.ts" },
        { actualLines: 300, maximumLines: 250, path: "src/larger.ts" },
      ]),
    });

    await expect(runLineCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledTimes(2);
  });

  it.each([
    [new Error("git failed"), "git failed\n"],
    ["failure", "Unknown line-policy failure.\n"],
  ])("redacts a read failure", async (failure, expected) => {
    const command = dependencies({
      readFiles: vi.fn(async () => Promise.reject(failure)),
    });

    await expect(runLineCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledWith(expected);
  });
});
