import { describe, expect, it, vi } from "vitest";
import {
  type DocumentationCommandDependencies,
  runDocumentationCommand,
} from "../src/documentation-command.js";

function dependencies(
  overrides: Partial<DocumentationCommandDependencies> = {},
): DocumentationCommandDependencies {
  return {
    findViolations: vi.fn(async () => []),
    writeError: vi.fn(),
    writeOutput: vi.fn(),
    ...overrides,
  };
}

describe("documentation command", () => {
  it("reports a passing repository", async () => {
    const command = dependencies();

    await expect(runDocumentationCommand(command)).resolves.toBe(0);
    expect(command.writeOutput).toHaveBeenCalledWith(
      "Documentation satisfies the repository policy.",
    );
  });

  it("reports paths, owners, and reasons", async () => {
    const command = dependencies({
      findViolations: vi.fn(async () => [
        { owner: "package", path: "package/README.md", reason: "missing reference" },
      ]),
    });

    await expect(runDocumentationCommand(command)).resolves.toBe(1);
    expect(command.writeError).toHaveBeenCalledWith(
      "Documentation policy violations:\n" +
        "- package/README.md [owner: package]: missing reference",
    );
  });
});
