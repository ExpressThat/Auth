import { describe, expect, it, vi } from "vitest";

describe("quality command entry points", () => {
  it("runs both policies against the repository", async () => {
    const write = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    await import("../src/check-lines.js");
    await import("../src/check-boundaries.js");

    expect(write).toHaveBeenCalledWith("First-party files satisfy the 250-line policy.\n");
    expect(write).toHaveBeenCalledWith(
      "Workspace dependencies and imports satisfy the boundary policy.\n",
    );
    write.mockRestore();
  });
});
