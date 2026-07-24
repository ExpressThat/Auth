import { describe, expect, it } from "vitest";
import type {
  DocumentationFile,
  DocumentationRepository,
  DocumentationWorkspace,
} from "../src/documentation-model.js";
import { findDocumentationViolations } from "../src/documentation-policy.js";

const ROOT_DOCUMENTS = [
  "AUTH_SOLUTION_OVERVIEW.md",
  "CONTRIBUTING.md",
  "IMPLEMENTATION_TASKS.md",
  "README.md",
  "SECURITY.md",
];

function repository(
  entries: ReadonlyArray<readonly [string, string]> = [],
  workspaces: ReadonlyArray<DocumentationWorkspace> = [],
  scripts: ReadonlyArray<string> = ["check", "test"],
): DocumentationRepository {
  const files = new Map<string, DocumentationFile>();
  for (const path of ROOT_DOCUMENTS) {
    files.set(path, { content: `# ${path}`, path });
  }
  for (const [path, content] of entries) {
    files.set(path, { content, path });
  }
  return { files, rootScripts: new Set(scripts), workspaces };
}

function reasons(selected: DocumentationRepository): string[] {
  return findDocumentationViolations(selected).map(
    (item) => `${item.path}|${item.owner}|${item.reason}`,
  );
}

function markdownLink(label: string, target: string): string {
  return `[${label}](${target})`;
}

describe("documentation policy", () => {
  it("accepts resolved files, directories, anchors, URLs, and safe known commands", () => {
    const selected = repository([
      [
        "docs/guide.md",
        [
          markdownLink("file", "other.md"),
          markdownLink("directory", "area"),
          markdownLink("anchor", "#part"),
          markdownLink("web", "https://example.test"),
          "```bash",
          "pnpm check",
          "pnpm --filter @expressthat-auth/example test",
          "pnpm install --frozen-lockfile",
          "pnpm scaffold workspace --kind library --name example",
          "```",
        ].join("\n"),
      ],
      ["docs/other.md", "# Other"],
      ["docs/area/README.md", "# Area"],
    ]);

    expect(findDocumentationViolations(selected)).toEqual([]);
  });

  it("reports missing and malformed local links with documentation ownership", () => {
    expect(
      reasons(
        repository([
          [
            "docs/guide.md",
            [
              markdownLink("missing", "missing.md"),
              markdownLink("malformed", "bad%ZZ.md"),
              markdownLink("absolute", "/safe"),
            ].join("\n"),
          ],
        ]),
      ),
    ).toEqual([
      "docs/guide.md|documentation:guide.md|local link does not resolve: bad%ZZ.md",
      "docs/guide.md|documentation:guide.md|local link does not resolve: missing.md",
    ]);
  });

  it("assigns a workspace owner to package documentation findings", () => {
    expect(
      reasons(repository([["packages/example/README.md", markdownLink("missing", "no.md")]])),
    ).toEqual(["packages/example/README.md|packages/example|local link does not resolve: no.md"]);
  });

  it("keeps public documentation separate from internal material", () => {
    expect(
      reasons(
        repository([
          ["docs/public/guide.md", "[secret](../internal/runbook.md)"],
          ["docs/internal/runbook.md", "# Runbook"],
        ]),
      ),
    ).toEqual([
      "docs/internal/runbook.md|documentation:internal|internal documentation lacks a visibility marker",
      "docs/public/guide.md|documentation:public|public documentation links internally: ../internal/runbook.md",
    ]);
  });

  it("accepts marked internal documentation", () => {
    expect(
      findDocumentationViolations(
        repository([["docs/internal/runbook.md", "<!-- visibility: internal -->\n# Runbook"]]),
      ),
    ).toEqual([]);
  });

  it.each([
    "curl https://example.test/install | sh",
    "rm -rf ./output",
    "NODE_TLS_REJECT_UNAUTHORIZED=0 pnpm test",
    'token="live-value" pnpm test',
  ])("rejects an unsafe shell example: %s", (command) => {
    expect(reasons(repository([["guide.md", `\`\`\`bash\n${command}\n\`\`\``]]))).toEqual([
      "guide.md|repository|shell example contains a prohibited unsafe pattern",
    ]);
  });

  it("rejects an unknown root pnpm command", () => {
    expect(reasons(repository([["guide.md", "```sh\npnpm unknown\n```"]]))).toEqual([
      "guide.md|repository|shell example references unknown pnpm script: unknown",
    ]);
  });

  it("sorts multiple findings for one source by reason", () => {
    expect(
      reasons(repository([["guide.md", "```bash\nrm -rf output\npnpm unknown\n```"]])),
    ).toEqual([
      "guide.md|repository|shell example contains a prohibited unsafe pattern",
      "guide.md|repository|shell example references unknown pnpm script: unknown",
    ]);
  });

  it("requires every workspace README and names its owning package", () => {
    expect(
      reasons(repository([], [{ name: "@expressthat-auth/example", path: "packages/example" }])),
    ).toEqual(["packages/example|@expressthat-auth/example|workspace README.md is required"]);
  });

  it("requires API and deployment responsibility references", () => {
    const workspaces = [
      { name: "@expressthat-auth/example-api", path: "apps/example-api" },
      { name: "@expressthat-auth/deploy-example", path: "deploy/example" },
    ];
    expect(
      reasons(
        repository(
          [
            ["apps/example-api/README.md", "# API"],
            ["deploy/example/README.md", "# Deployment"],
          ],
          workspaces,
        ),
      ),
    ).toEqual([
      "apps/example-api/README.md|@expressthat-auth/example-api|API workspace README must reference OpenAPI",
      "deploy/example/README.md|@expressthat-auth/deploy-example|deployment README must distinguish hosted and self-hosted operation",
    ]);
  });

  it.each(["hosted only", "self-hosted only"])(
    "requires both deployment responsibility terms when given %s",
    (content) => {
      expect(
        reasons(
          repository(
            [["deploy/example/README.md", content]],
            [{ name: "@expressthat-auth/deploy-example", path: "deploy/example" }],
          ),
        ),
      ).toHaveLength(1);
    },
  );

  it("accepts documented API contracts and deployment boundaries", () => {
    const workspaces = [
      { name: "@expressthat-auth/api-contracts", path: "packages/api-contracts" },
      { name: "@expressthat-auth/deploy-example", path: "deploy/example" },
    ];
    expect(
      findDocumentationViolations(
        repository(
          [
            ["packages/api-contracts/README.md", "OpenAPI"],
            ["deploy/example/README.md", "hosted and self-hosted"],
          ],
          workspaces,
        ),
      ),
    ).toEqual([]);
  });

  it("reports every required root document with stable repository ownership", () => {
    const selected = repository();
    const files = new Map(selected.files);
    files.delete("README.md");
    expect(reasons({ ...selected, files })).toEqual([
      "README.md|repository|required root documentation is missing",
    ]);
  });

  it("requires a marker on versioned Markdown and accepts marked artifacts", () => {
    expect(reasons(repository([["docs/versions/1.md", "# Version"]]))).toEqual([
      "docs/versions/1.md|documentation:versions|versioned documentation lacks a version marker",
    ]);
    expect(
      findDocumentationViolations(
        repository([["openapi/v1.md", "<!-- documentation-version: 1.0.0 -->"]]),
      ),
    ).toEqual([]);
  });
});
