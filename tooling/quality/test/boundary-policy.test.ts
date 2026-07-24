import { describe, expect, it } from "vitest";
import { classifyWorkspace, permitsDependency } from "../src/boundary-policy.js";
import { workspace } from "./boundary-fixtures.js";

describe("workspace classification", () => {
  it.each([
    ["apps/auth-api", "@expressthat-auth/auth-api", "application"],
    ["deploy/docker", "@expressthat-auth/deploy-docker", "deployment"],
    ["tooling/quality", "@expressthat-auth/quality", "tooling"],
    ["packages/typescript-config", "@expressthat-auth/typescript-config", "shared-config"],
    ["packages/database-conformance", "@expressthat-auth/database-conformance", "conformance"],
    ["packages/database-sqlite", "@expressthat-auth/database-sqlite", "implementation"],
    ["packages/providers/email", "@expressthat-auth/provider-email", "implementation"],
    ["packages/domain", "@expressthat-auth/domain", "runtime-neutral"],
    ["apps\\jobs", "@expressthat-auth/jobs", "application"],
  ])("classifies %s", (path, name, expected) => {
    expect(classifyWorkspace(path, name)).toBe(expected);
  });
});

describe("dependency direction", () => {
  it.each([
    ["application", "runtime-neutral", true],
    ["application", "implementation", true],
    ["application", "application", false],
    ["conformance", "implementation", true],
    ["conformance", "runtime-neutral", true],
    ["deployment", "application", true],
    ["deployment", "implementation", true],
    ["deployment", "deployment", false],
    ["implementation", "implementation", true],
    ["implementation", "runtime-neutral", true],
    ["runtime-neutral", "runtime-neutral", true],
    ["runtime-neutral", "implementation", false],
    ["shared-config", "shared-config", true],
    ["shared-config", "runtime-neutral", false],
    ["tooling", "shared-config", true],
    ["tooling", "runtime-neutral", false],
  ] as const)("permits %s to depend on %s: %s", (sourceKind, targetKind, expected) => {
    expect(
      permitsDependency(
        workspace("source", sourceKind),
        workspace("target", targetKind),
        "dependencies",
      ),
    ).toBe(expected);
  });

  it("allows shared test configuration only as a development dependency", () => {
    const source = workspace("@expressthat-auth/domain");
    const target = workspace("@expressthat-auth/test-config", "shared-config");

    expect(permitsDependency(source, target, "devDependencies")).toBe(true);
    expect(permitsDependency(source, target, "dependencies")).toBe(false);
  });

  it("separates API contracts and UI from data and runtime implementations", () => {
    const contracts = workspace("@expressthat-auth/api-contracts");
    const ui = workspace("@expressthat-auth/ui", "implementation");

    expect(
      permitsDependency(contracts, workspace("@expressthat-auth/data-access"), "dependencies"),
    ).toBe(false);
    expect(
      permitsDependency(
        contracts,
        workspace("@expressthat-auth/database-postgres", "implementation"),
        "dependencies",
      ),
    ).toBe(false);
    expect(permitsDependency(ui, workspace("@expressthat-auth/runtime"), "dependencies")).toBe(
      false,
    );
  });
});
