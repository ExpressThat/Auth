import { describe, expect, it } from "vitest";
import { createWorkspacePlan } from "../src/workspace-plan.js";

describe("workspace generation plan", () => {
  it.each([
    ["application", "apps/example-api"],
    ["library", "packages/example-core"],
    ["provider", "packages/providers/example-email"],
  ] as const)("creates a complete %s workspace", (kind, root) => {
    const plan = createWorkspacePlan(kind, root.slice(root.lastIndexOf("/") + 1), "Description.");
    const paths = plan.changes.map((change) => change.path);

    expect(paths).toEqual([
      `${root}/README.md`,
      `${root}/package.json`,
      `${root}/tsconfig.json`,
      `${root}/vitest.config.ts`,
      `${root}/src/index.ts`,
      `${root}/test/index.test.ts`,
    ]);
    expect(plan.changes.every((change) => change.mode === "create")).toBe(true);
    expect(plan.summary).toContain("@expressthat-auth/");
  });

  it("includes canonical exports, tasks, tests, and documentation", () => {
    const plan = createWorkspacePlan("library", "consent-core", "Consent policies.");
    const manifest = plan.changes.find((change) => change.path.endsWith("package.json"));
    const source = plan.changes.find((change) => change.path.endsWith("src/index.ts"));
    const test = plan.changes.find((change) => change.path.endsWith("test/index.test.ts"));
    const readme = plan.changes.find((change) => change.path.endsWith("README.md"));

    expect(manifest?.content).toContain('"name": "@expressthat-auth/consent-core"');
    expect(manifest?.content).toContain('"test:coverage": "vitest run --coverage"');
    expect(manifest?.content).toContain('"exports"');
    expect(plan.changes.find((change) => change.path.endsWith("tsconfig.json"))?.content).toContain(
      "typescript-config/library.json",
    );
    expect(source?.content).toContain("workspaceInfo");
    expect(test?.content).toContain('from "../src/index.js"');
    for (const section of [
      "Purpose and boundary",
      "Public exports",
      "Runtimes and dependencies",
      "Commands and tests",
      "Extension points",
      "Security and privacy",
      "Further documentation",
    ]) {
      expect(readme?.content).toContain(section);
    }
  });

  it("keeps every generated non-documentation file under the source limit", () => {
    const plan = createWorkspacePlan("application", "example-api", "Example.");

    for (const change of plan.changes.filter((item) => !item.path.endsWith(".md"))) {
      expect(change.content.split(/\r?\n/u).length - 1, change.path).toBeLessThanOrEqual(250);
    }
  });
});
