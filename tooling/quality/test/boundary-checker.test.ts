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

  it("includes stateless-service process-state violations", async () => {
    const app = {
      name: "@expressthat-auth/auth-api",
    };
    const violations = await findBoundaryViolations([
      file("apps/auth-api/package.json", JSON.stringify(app)),
      file("apps/auth-api/src/session.ts", "export const sessions = new Map();"),
    ]);

    expect(violations).toEqual([
      {
        code: "module-process-state",
        message:
          "sessions can retain cross-request process state; inject a shared adapter instead.",
        path: "apps/auth-api/src/session.ts",
      },
    ]);
  });
});
