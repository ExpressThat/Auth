import { describe, expect, it } from "vitest";
import { findSourceViolations } from "../src/source-boundaries.js";
import { dependency, file, workspace } from "./boundary-fixtures.js";

describe("source import boundaries", () => {
  it("ignores external, relative, non-source, and non-workspace files", async () => {
    const domain = workspace("@expressthat-auth/domain");
    const files = [
      file("packages/domain/src/index.ts", 'import "zod"; import "./local.js";'),
      file("packages/domain/src/dynamic.ts", "const name = 'zod'; import(name);"),
      file("packages/domain/schema.json", '"@expressthat-auth/missing"'),
      file("outside.ts", 'import "@expressthat-auth/missing";'),
    ];

    await expect(findSourceViolations([domain], files)).resolves.toEqual([]);
  });

  it("reports unknown, undeclared, and non-public imports", async () => {
    const source = workspace("@expressthat-auth/source", "runtime-neutral", [], []);
    const target = workspace("@expressthat-auth/target", "runtime-neutral", [], []);
    const sourceFile = file(
      "packages/source/src/index.ts",
      ['import "@expressthat-auth/missing";', 'export * from "@expressthat-auth/target";'].join(
        "\n",
      ),
    );

    const violations = await findSourceViolations([source, target], [sourceFile]);
    expect(violations.map((item) => item.code)).toEqual([
      "unknown-import",
      "undeclared-import",
      "missing-public-export",
    ]);
  });

  it("accepts declared root and explicitly exported subpath imports", async () => {
    const source = workspace("@expressthat-auth/source", "runtime-neutral", [
      dependency("@expressthat-auth/target"),
    ]);
    const target = workspace(
      "@expressthat-auth/target",
      "runtime-neutral",
      [],
      [".", "./public", "./features/*"],
    );
    const sourceFile = file(
      "packages/source/src/index.ts",
      [
        'import "@expressthat-auth/target";',
        'import("@expressthat-auth/target/public");',
        'export * from "@expressthat-auth/target/features/one";',
      ].join("\n"),
    );

    await expect(findSourceViolations([source, target], [sourceFile])).resolves.toEqual([]);
  });

  it("rejects an undeclared deep import", async () => {
    const source = workspace("@expressthat-auth/source");
    const target = workspace("@expressthat-auth/target", "runtime-neutral", [], ["."]);
    const sourceFile = file(
      "packages/source/src/index.ts",
      'import "@expressthat-auth/target/src/private";',
    );

    const violations = await findSourceViolations([source, target], [sourceFile]);
    expect(violations.map((item) => item.code)).toEqual(["undeclared-import", "deep-import"]);
  });

  it("allows a package to import its own public API without a dependency entry", async () => {
    const source = workspace("@expressthat-auth/source");
    const sourceFile = file("packages/source/src/index.ts", 'import "@expressthat-auth/source";');

    await expect(findSourceViolations([source], [sourceFile])).resolves.toEqual([]);
  });

  it("parses TSX and rejects invalid source during boundary inspection", async () => {
    const source = workspace("@expressthat-auth/source");

    await expect(
      findSourceViolations(
        [source],
        [file("packages/source/src/view.tsx", "export const View = () => <p>Ready</p>;")],
      ),
    ).resolves.toEqual([]);
    await expect(
      findSourceViolations([source], [file("packages/source/src/broken.ts", "export const = ;")]),
    ).rejects.toThrow("Cannot inspect imports");
  });
});
