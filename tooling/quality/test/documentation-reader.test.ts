import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { readDocumentationRepository } from "../src/documentation-reader.js";
import type { RepositoryFile } from "../src/line-checker.js";

function file(path: string, content: string): RepositoryFile {
  return { content: Buffer.from(content), path };
}

describe("documentation repository reader", () => {
  it("reads root scripts, text, and normalized workspaces", () => {
    const repository = readDocumentationRepository([
      file("package.json", '{"name":"root","scripts":{"check":"command"}}'),
      file(
        "packages\\example\\package.json",
        '{"name":"@expressthat-auth/example","scripts":{"test":"vitest"}}',
      ),
      file(["packages", "example", "README.md"].join("\\"), "# Example"),
      file("unrelated.json", "{}"),
    ]);

    expect([...repository.rootScripts]).toEqual(["check"]);
    expect(repository.workspaces).toEqual([
      { name: "@expressthat-auth/example", path: "packages/example" },
    ]);
    expect(repository.files.get("packages/example/README.md")?.content).toBe("# Example");
  });

  it("supports a root manifest without scripts and sorts workspaces", () => {
    const repository = readDocumentationRepository([
      file("package.json", '{"name":"root"}'),
      file("tooling/z/package.json", '{"name":"z"}'),
      file("apps/a/package.json", '{"name":"a"}'),
    ]);

    expect(repository.rootScripts.size).toBe(0);
    expect(repository.workspaces.map((workspace) => workspace.name)).toEqual(["a", "z"]);
  });

  it("rejects an invalid manifest", () => {
    expect(() =>
      readDocumentationRepository([file("package.json", '{"scripts":{"check":"command"}}')]),
    ).toThrow();
  });
});
