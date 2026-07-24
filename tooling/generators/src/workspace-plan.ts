import type { FileChange, GenerationPlan } from "./generator-model.js";

type WorkspaceKind = "application" | "library" | "provider";

function workspacePath(kind: WorkspaceKind, name: string): string {
  switch (kind) {
    case "application":
      return `apps/${name}`;
    case "library":
      return `packages/${name}`;
    case "provider":
      return `packages/providers/${name}`;
  }
}

function manifest(name: string, description: string): string {
  return `${JSON.stringify(
    {
      name: `@expressthat-auth/${name}`,
      version: "0.0.0",
      private: true,
      description,
      license: "MIT",
      type: "module",
      exports: { ".": "./src/index.ts" },
      scripts: {
        build: "tsc --noEmit",
        lint: "tsc --noEmit",
        test: "vitest run",
        "test:coverage": "vitest run --coverage",
        typecheck: "tsc --noEmit",
      },
      devDependencies: {
        "@expressthat-auth/test-config": "workspace:*",
        "@expressthat-auth/typescript-config": "workspace:*",
        "@vitest/coverage-v8": "4.1.10",
        vitest: "4.1.10",
      },
    },
    undefined,
    2,
  )}\n`;
}

function source(name: string, kind: WorkspaceKind): string {
  return `/** Identifies this workspace to repository tooling and generated documentation. */
export const workspaceInfo = Object.freeze({
  kind: "${kind}",
  name: "@expressthat-auth/${name}",
});
`;
}

function readme(name: string, description: string, kind: WorkspaceKind): string {
  return `# @expressthat-auth/${name}

${description}

## Purpose and boundary

This is a generated ${kind} workspace. Replace this paragraph with its owned
responsibilities and explicitly list responsibilities that remain outside it.

## Public exports

- \`.\` — generated workspace identity; document each real export as it is added.

## Runtimes and dependencies

Document supported Docker/Node and browser runtimes and explain every runtime or
infrastructure dependency.

## Commands and tests

- \`pnpm build\`
- \`pnpm lint\`
- \`pnpm test\`
- \`pnpm test:coverage\`
- \`pnpm typecheck\`

Document conformance, integration, security, and runtime-specific suites as they
are introduced.

## Extension points

Document public contracts, adapter capabilities, configuration schemas, and
compatibility rules before adding implementations.

## Security and privacy

Document trust boundaries, authorization and tenant scope, input limits, data
classification, secrets, redaction, failure behaviour, and hosted versus
self-hosted responsibilities affected by this workspace.

## Further documentation

Link relevant architecture decisions, API guides, operations runbooks, threat
model entries, and user or administrator guidance here as they are created.
`;
}

function test(name: string, kind: WorkspaceKind): string {
  return `import { describe, expect, it } from "vitest";
import { workspaceInfo } from "../src/index.js";

describe("@expressthat-auth/${name}", () => {
  it("publishes its generated workspace identity", () => {
    expect(workspaceInfo).toEqual({
      kind: "${kind}",
      name: "@expressthat-auth/${name}",
    });
  });
});
`;
}

export function createWorkspacePlan(
  kind: WorkspaceKind,
  name: string,
  description: string,
): GenerationPlan {
  const root = workspacePath(kind, name);
  const create = (path: string, content: string): FileChange => ({
    content,
    mode: "create",
    path: `${root}/${path}`,
  });

  return {
    changes: [
      create("README.md", readme(name, description, kind)),
      create("package.json", manifest(name, description)),
      create(
        "tsconfig.json",
        '{\n  "extends": "@expressthat-auth/typescript-config/library.json",\n' +
          '  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]\n}\n',
      ),
      create(
        "vitest.config.ts",
        'import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";\n\n' +
          "export default createUnitTestConfig();\n",
      ),
      create("src/index.ts", source(name, kind)),
      create("test/index.test.ts", test(name, kind)),
    ],
    summary: `Created ${kind} workspace @expressthat-auth/${name}.`,
  };
}
