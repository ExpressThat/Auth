import { describe, expect, it } from "vitest";
import { readWorkspaces } from "../src/workspace-reader.js";
import { file } from "./boundary-fixtures.js";

describe("workspace manifest reader", () => {
  it("reads dependencies, classifications, and public exports", () => {
    const manifest = {
      dependencies: { "@expressthat-auth/domain": "workspace:*" },
      devDependencies: { "@expressthat-auth/test-config": "workspace:*" },
      exports: { ".": "./src/index.ts", "./public": "./src/public.ts" },
      name: "@expressthat-auth/example",
      optionalDependencies: { "@expressthat-auth/runtime": "workspace:*" },
      peerDependencies: { "@expressthat-auth/config": "workspace:*" },
      scripts: { build: "tsc --noEmit", test: "vitest run" },
    };
    const workspaces = readWorkspaces([
      file("packages/example/package.json", JSON.stringify(manifest)),
      file("package.json", '{"name":"root"}'),
      file("docs/package.json", '{"name":"docs"}'),
    ]);

    expect(workspaces).toHaveLength(1);
    expect(workspaces[0]).toMatchObject({
      kind: "runtime-neutral",
      name: "@expressthat-auth/example",
      path: "packages/example",
    });
    expect(workspaces[0]?.dependencies).toHaveLength(4);
    expect(workspaces[0]?.exports).toEqual(new Set([".", "./public"]));
    expect(workspaces[0]?.scripts).toEqual(new Set(["build", "test"]));
  });

  it("sorts multiple workspaces by package name", () => {
    const workspaces = readWorkspaces([
      file("packages/z/package.json", '{"name":"@expressthat-auth/z"}'),
      file("packages/a/package.json", '{"name":"@expressthat-auth/a"}'),
    ]);

    expect(workspaces.map((workspace) => workspace.name)).toEqual([
      "@expressthat-auth/a",
      "@expressthat-auth/z",
    ]);
  });

  it.each([
    ['{"name":"@expressthat-auth/string","exports":"./index.js"}', ["."]],
    ['{"name":"@expressthat-auth/array","exports":["./index.js"]}', ["."]],
    ['{"name":"@expressthat-auth/none"}', []],
  ])("normalizes export forms", (source, expected) => {
    expect(readWorkspaces([file("packages\\example\\package.json", source)])[0]?.exports).toEqual(
      new Set(expected),
    );
  });

  it("rejects malformed and structurally invalid manifests", () => {
    expect(() => readWorkspaces([file("packages/example/package.json", "{")])).toThrow();
    expect(() => readWorkspaces([file("packages/example/package.json", '{"name":""}')])).toThrow();
  });
});
