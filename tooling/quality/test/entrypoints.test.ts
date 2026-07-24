import { describe, expect, it, vi } from "vitest";

describe("quality command entry points", () => {
  it("runs repository policies against the repository", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await import("../src/check-lines.js");
    await import("../src/check-boundaries.js");
    await import("../src/check-artifacts.js");
    await import("../src/check-documentation.js");

    expect(write).toHaveBeenCalledWith("First-party files satisfy the 250-line policy.\n");
    expect(write).toHaveBeenCalledWith(
      "Workspace dependencies and imports satisfy the boundary policy.\n",
    );
    expect(write).toHaveBeenCalledWith(
      "Generated artifacts satisfy the repository security policy.\n",
    );
    expect(write).toHaveBeenCalledWith("Documentation satisfies the repository policy.\n");
    write.mockRestore();
  }, 15_000);

  it("wires the licence command without running a nested package manager", async () => {
    const dependencies = { marker: "dependencies" };
    const run = vi.fn(() => 0);
    vi.doMock("../src/license-command.js", () => ({
      defaultLicenseCommandDependencies: () => dependencies,
      runLicenseCommand: run,
    }));

    await import("../src/check-licenses.js");

    expect(run).toHaveBeenCalledWith(expect.any(String), dependencies);
    vi.doUnmock("../src/license-command.js");
  });

  it("wires documentation findings to standard error", async () => {
    vi.resetModules();
    vi.doMock("../src/documentation-policy.js", () => ({
      findDocumentationViolations: () => [
        { owner: "documentation", path: "guide.md", reason: "test finding" },
      ],
    }));
    const write = vi.spyOn(process.stderr, "write").mockImplementation(() => true);

    await import("../src/check-documentation.js");

    expect(write).toHaveBeenCalledWith(
      "Documentation policy violations:\n" + "- guide.md [owner: documentation]: test finding\n",
    );
    write.mockRestore();
    vi.doUnmock("../src/documentation-policy.js");
  });
});
