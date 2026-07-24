import { describe, expect, it, vi } from "vitest";

describe("generator entry point", () => {
  it("wires repository arguments to the command", async () => {
    const dependencies = { marker: "dependencies" };
    const run = vi.fn(async () => 0);
    vi.doMock("../src/generator-command.js", () => ({
      defaultGeneratorCommandDependencies: () => dependencies,
      runGeneratorCommand: run,
    }));

    await import("../src/generate.js");

    expect(run).toHaveBeenCalledWith(expect.any(String), expect.arrayContaining([]), dependencies);
    vi.doUnmock("../src/generator-command.js");
  });
});
