import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { findCoveragePolicyViolations } from "../src/coverage-policy.js";
import type { RepositoryFile } from "../src/line-checker.js";

function file(path: string, content = ""): RepositoryFile {
  return { content: Buffer.from(content), path };
}

function manifest(path: string, scripts?: Record<string, string>): RepositoryFile {
  return file(path, JSON.stringify({ name: "@expressthat-auth/example", scripts }));
}

describe("coverage policy", () => {
  it("accepts executable packages using either shared strict preset", () => {
    const files = [
      manifest("packages/a/package.json", { test: "vitest run", "test:coverage": "vitest run -c" }),
      file("packages/a/src/index.ts", "export const value = 1;"),
      file("packages/a/vitest.config.ts", 'import "@expressthat-auth/test-config/vitest";'),
      manifest("packages/b/package.json", { test: "vitest run", "test:coverage": "vitest run -c" }),
      file("packages/b/src/view.tsx", "export const view = null;"),
      file("packages/b/vitest.ui.config.ts", 'import "@expressthat-auth/test-config/component";'),
    ];

    expect(findCoveragePolicyViolations(files)).toEqual([]);
  });

  it("requires tests, coverage, and the shared threshold preset", () => {
    const files = [
      manifest("apps/api/package.json"),
      file("apps/api/src/index.ts", "export const app = {};"),
    ];

    expect(findCoveragePolicyViolations(files)).toEqual([
      { code: "missing-coverage-script", path: "apps/api/package.json" },
      { code: "missing-shared-preset", path: "apps/api/package.json" },
      { code: "missing-test-script", path: "apps/api/package.json" },
    ]);
  });

  it("ignores non-workspaces and non-executable source", () => {
    const files = [
      manifest("packages/types/package.json"),
      file("packages/types/src/index.d.ts", "export type Identifier = string;"),
      file("packages/types/src/generated/client.ts", "generated"),
      file("packages/types/src/vendor/library.ts", "third party"),
      file("packages/types/src/client.generated.ts", "generated"),
      manifest("package.json"),
      file("src/index.ts", "root tooling"),
    ];

    expect(findCoveragePolicyViolations(files)).toEqual([]);
  });

  it("normalizes Windows workspace paths", () => {
    const files = [
      manifest("tooling\\check\\package.json", {
        test: "vitest run",
        "test:coverage": "vitest run --coverage",
      }),
      file("tooling\\check\\src\\index.ts", "export const check = true;"),
      file("tooling\\check\\vitest.config.ts", 'import "@expressthat-auth/test-config/vitest";'),
    ];

    expect(findCoveragePolicyViolations(files)).toEqual([]);
  });

  it("rejects malformed manifests at the trust boundary", () => {
    const files = [
      file("packages/a/package.json", '{"scripts":{"test":false}}'),
      file("packages/a/src/index.ts", "export const value = 1;"),
    ];

    expect(() => findCoveragePolicyViolations(files)).toThrow();
  });
});
