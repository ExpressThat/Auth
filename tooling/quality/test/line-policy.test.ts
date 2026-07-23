import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { findLineExemption } from "../src/line-policy.js";

const TEXT = Buffer.from("first-party");

describe("line policy exemptions", () => {
  it.each([
    ["README.md", "documentation"],
    ["guide.mdx", "documentation"],
    ["worker-configuration.d.ts", "generated content"],
    ["src/client.generated.ts", "generated content"],
    ["pnpm-lock.yaml", "lockfile"],
    ["package-lock.json", "lockfile"],
    ["yarn.lock", "lockfile"],
    ["node_modules/package/index.js", "third-party code"],
    ["vendor/library.js", "third-party code"],
    ["third_party/library.js", "third-party code"],
    ["src/generated/client.ts", "generated content"],
    ["dist/index.js", "generated output"],
    ["coverage/report.json", "tool output"],
    [".turbo/cache.json", "tool output"],
    ["playwright-report/index.html", "tool output"],
    ["test-results/result.json", "tool output"],
    ["src\\generated\\client.ts", "generated content"],
  ])("exempts %s as %s", (path, reason) => {
    expect(findLineExemption(path, TEXT)).toBe(reason);
  });

  it("exempts binary content", () => {
    expect(findLineExemption("assets/logo.png", Buffer.from([1, 0, 2]))).toBe("binary content");
  });

  it("does not exempt first-party source or configuration", () => {
    expect(findLineExemption("src/service.ts", TEXT)).toBeUndefined();
    expect(findLineExemption("biome.json", TEXT)).toBeUndefined();
  });
});
