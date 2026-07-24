import { describe, expect, it } from "vitest";
import { findManifestViolations } from "../src/workspace-graph.js";
import { dependency, workspace } from "./boundary-fixtures.js";

describe("workspace manifest graph", () => {
  it("reports unknown internal dependencies and forbidden direction", () => {
    const application = workspace("@expressthat-auth/app", "application", [
      dependency("@expressthat-auth/missing"),
      dependency("@expressthat-auth/other-app"),
      dependency("external-package"),
    ]);
    const otherApplication = workspace("@expressthat-auth/other-app", "application");

    expect(findManifestViolations([application, otherApplication])).toMatchObject([
      { code: "forbidden-direction" },
      { code: "unknown-workspace" },
    ]);
  });

  it("reports a workspace cycle once", () => {
    const first = workspace("@expressthat-auth/first", "runtime-neutral", [
      dependency("@expressthat-auth/second"),
    ]);
    const second = workspace("@expressthat-auth/second", "runtime-neutral", [
      dependency("@expressthat-auth/first"),
      dependency("@expressthat-auth/first", "devDependencies"),
    ]);

    const violations = findManifestViolations([first, second]);
    expect(violations.filter((violation) => violation.code === "workspace-cycle")).toHaveLength(1);
    expect(violations[0]?.message).toContain("@expressthat-auth/first");
  });

  it("accepts an acyclic permitted graph", () => {
    const domain = workspace("@expressthat-auth/domain");
    const app = workspace("@expressthat-auth/app", "application", [
      dependency("@expressthat-auth/domain"),
    ]);

    expect(findManifestViolations([app, domain])).toEqual([]);
  });

  it("does not revisit a completed dependency in a diamond graph", () => {
    const leaf = workspace("@expressthat-auth/leaf");
    const left = workspace("@expressthat-auth/left", "runtime-neutral", [
      dependency("@expressthat-auth/leaf"),
    ]);
    const root = workspace("@expressthat-auth/root", "runtime-neutral", [
      dependency("@expressthat-auth/left"),
      dependency("@expressthat-auth/leaf"),
    ]);

    expect(findManifestViolations([root, left, leaf])).toEqual([]);
  });
});
