import { describe, expect, it, vi } from "vitest";
import { type ArtifactCommandDependencies, runArtifactCommand } from "../src/artifact-command.js";

function dependencies(
  overrides: Partial<ArtifactCommandDependencies> = {},
): ArtifactCommandDependencies {
  return {
    findViolations: vi.fn(() => []),
    readFiles: vi.fn(async () => []),
    stderr: { write: vi.fn() },
    stdout: { write: vi.fn() },
    ...overrides,
  };
}

describe("artifact-policy command", () => {
  it("reports a passing repository", async () => {
    const command = dependencies();

    await expect(runArtifactCommand("repository", command)).resolves.toBe(0);
    expect(command.stdout.write).toHaveBeenCalledWith(
      "Generated artifacts satisfy the repository security policy.\n",
    );
  });

  it("reports every finding", async () => {
    const command = dependencies({
      findViolations: vi.fn(() => [
        { path: "generated/a.zip", reason: "archive" },
        { path: "generated/b.key", reason: "private key" },
      ]),
    });

    await expect(runArtifactCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledTimes(2);
  });

  it.each([
    [new Error("git failed"), "git failed\n"],
    ["failure", "Unknown artifact-policy failure.\n"],
  ])("reports a redacted repository failure", async (failure, expected) => {
    const command = dependencies({
      readFiles: vi.fn(async () => Promise.reject(failure)),
    });

    await expect(runArtifactCommand("repository", command)).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledWith(expected);
  });
});
