import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { DocumentationFile, DocumentationRepository } from "../src/documentation-model.js";
import { findDocumentationViolations } from "../src/documentation-policy.js";

const ROOT_DOCUMENTS = [
  "AUTH_SOLUTION_OVERVIEW.md",
  "CONTRIBUTING.md",
  "IMPLEMENTATION_TASKS.md",
  "README.md",
  "SECURITY.md",
];

function repository(entries: ReadonlyArray<readonly [string, string]>): DocumentationRepository {
  const files = new Map<string, DocumentationFile>();
  for (const path of ROOT_DOCUMENTS) {
    files.set(path, { content: `# ${path}`, path });
  }
  for (const [path, content] of entries) {
    files.set(path, { content, path });
  }
  return { files, rootScripts: new Set(), workspaces: [] };
}

function reasons(selected: DocumentationRepository): string[] {
  return findDocumentationViolations(selected).map((item) => item.reason);
}

describe("generated documentation policy", () => {
  it("validates source markers and hashes", () => {
    const source = "source content";
    const hash = createHash("sha256").update(source).digest("hex");
    const path = "docs/generated/reference.md";

    expect(
      findDocumentationViolations(
        repository([
          ["schema/source.txt", source],
          [path, `<!-- generated-from: schema/source.txt; sha256: ${hash} -->`],
        ]),
      ),
    ).toEqual([]);
    expect(reasons(repository([[path, "# Missing marker"]]))).toEqual([
      "generated documentation lacks source and SHA-256 marker",
    ]);
    expect(
      reasons(repository([[path, `<!-- generated-from: missing.txt; sha256: ${hash} -->`]])),
    ).toEqual(["generated documentation source does not exist: missing.txt"]);
    expect(
      reasons(
        repository([
          ["schema/source.txt", "changed"],
          [path, `<!-- generated-from: schema/source.txt; sha256: ${hash} -->`],
        ]),
      ),
    ).toEqual(["generated documentation is stale for source: schema/source.txt"]);
  });
});
