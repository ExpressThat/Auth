import { describe, expect, it } from "vitest";

describe("example unit test", () => {
  it("adds numbers correctly", () => {
    expect(1 + 1).toBe(2);
  });

  it("string contains", () => {
    expect("ExpressThat Auth").toContain("Auth");
  });
});
