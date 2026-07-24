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
});
