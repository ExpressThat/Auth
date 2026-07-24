import { afterEach, describe, expect, it, vi } from "vitest";

const executeLocalStack = vi.fn();

vi.mock("../src/local-stack.js", () => ({ executeLocalStack }));

const originalArguments = [...process.argv];
const originalExitCode = process.exitCode;

afterEach(() => {
  process.argv = [...originalArguments];
  process.exitCode = originalExitCode;
  executeLocalStack.mockReset();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("local stack entrypoint", () => {
  it("passes command arguments to the stack runner", async () => {
    process.argv = ["node", "local-stack-cli.ts", "validate"];
    executeLocalStack.mockResolvedValue(undefined);

    await import("../src/local-stack-cli.js");

    expect(executeLocalStack).toHaveBeenCalledWith(["validate"]);
  });

  it.each([
    [new Error("expected failure"), "expected failure"],
    ["non-error failure", "Unknown local stack failure."],
  ])("reports a safe failure", async (failure, expected) => {
    process.argv = ["node", "local-stack-cli.ts", "up"];
    executeLocalStack.mockRejectedValue(failure);
    const write = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    await import("../src/local-stack-cli.js");

    expect(write).toHaveBeenCalledWith(`${expected}\n`);
    expect(process.exitCode).toBe(1);
  });
});
