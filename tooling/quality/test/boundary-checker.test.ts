import { describe, expect, it } from "vitest";
import { findBoundaryViolations } from "../src/boundary-checker.js";
import { file } from "./boundary-fixtures.js";

describe("boundary checker", () => {
  it("combines and sorts manifest and source violations", async () => {
    const app = {
      dependencies: { "@expressthat-auth/missing": "workspace:*" },
      name: "@expressthat-auth/app",
    };
    const violations = await findBoundaryViolations([
      file("apps/app/package.json", JSON.stringify(app)),
      file(
        "apps/app/src/index.ts",
        'import "@expressthat-auth/unknown"; import "@expressthat-auth/another";',
      ),
    ]);

    expect(violations.map((violation) => violation.code)).toEqual([
      "unknown-workspace",
      "unknown-import",
      "unknown-import",
    ]);
  });

  it("includes adapter packaging violations", async () => {
    const adapter = {
      dependencies: { "@expressthat-auth/runtime": "workspace:*" },
      exports: { ".": "./src/index.ts" },
      name: "@expressthat-auth/queue-reference",
    };

    const violations = await findBoundaryViolations([
      file("packages/providers/queue-reference/package.json", JSON.stringify(adapter)),
    ]);

    expect(violations.map((violation) => violation.code)).toEqual([
      "missing-adapter-metadata",
      "unknown-workspace",
    ]);
  });
});
