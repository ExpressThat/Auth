import { z } from "zod";
import type { GenerationPlan } from "./generator-model.js";

const stringRecordSchema = z.record(z.string(), z.string()).optional();
const manifestSchema = z
  .object({
    dependencies: stringRecordSchema,
    devDependencies: stringRecordSchema,
    exports: stringRecordSchema,
    name: z.string().startsWith("@expressthat-auth/"),
    scripts: stringRecordSchema,
  })
  .loose();

function identifier(name: string): string {
  return name.replace(/-([a-z0-9])/gu, (_match, character: string) => character.toUpperCase());
}

function routeSource(name: string): string {
  const symbol = identifier(name);
  return `import { createRoute, z } from "@hono/zod-openapi";

export const ${symbol}ResponseSchema = z.object({
  status: z.literal("ok"),
});

export const ${symbol}Route = createRoute({
  method: "get",
  path: "/${name}",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: ${symbol}ResponseSchema,
        },
      },
      description: "Successful ${name} response.",
    },
  },
});
`;
}

function routeTest(name: string): string {
  const symbol = identifier(name);
  return `import { describe, expect, it } from "vitest";
import { ${symbol}ResponseSchema, ${symbol}Route } from "../../src/routes/${name}.js";

describe("${name} route contract", () => {
  it("publishes a typed GET contract and response schema", () => {
    expect(${symbol}Route.method).toBe("get");
    expect(${symbol}Route.path).toBe("/${name}");
    expect(${symbol}ResponseSchema.parse({ status: "ok" })).toEqual({ status: "ok" });
  });
});
`;
}

function routeDocumentation(name: string): string {
  return `# GET /${name}

## Purpose

Describe the user or system outcome provided by this route.

## Access and tenant scope

Document authentication, scopes, permissions, active organisation and
environment checks, and denied behavior.

## Contract

The source contract is \`src/routes/${name}.ts\`. Keep its OpenAPI summary,
request and response schemas, errors, limits, idempotency, and safe synthetic
examples aligned with the implementation.

## Security, privacy, and operations

Document untrusted inputs, abuse controls, data classification, audit events,
redaction, dependency failures, observability, and Workers/Docker differences.
`;
}

export function createRoutePlan(
  application: string,
  name: string,
  manifestSource: string,
): GenerationPlan {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the manifest schema.
  const untrustedManifest: unknown = JSON.parse(manifestSource);
  const manifest = manifestSchema.parse(untrustedManifest);
  if (manifest.name !== `@expressthat-auth/${application}`) {
    throw new Error(`Application manifest does not match apps/${application}.`);
  }
  const exportName = `./routes/${name}`;
  if (manifest.exports?.[exportName] !== undefined) {
    throw new Error(`Route export ${exportName} already exists.`);
  }

  const root = `apps/${application}`;
  const updatedManifest = {
    ...manifest,
    dependencies: {
      ...manifest.dependencies,
      "@hono/zod-openapi": "1.5.1",
      zod: "4.4.3",
    },
    exports: {
      ...manifest.exports,
      [exportName]: `./src/routes/${name}.ts`,
    },
    scripts: {
      ...manifest.scripts,
      build: "tsc --noEmit",
      lint: "tsc --noEmit",
      test: "vitest run",
      "test:coverage": "vitest run --coverage",
      typecheck: "tsc --noEmit",
    },
    devDependencies: {
      ...manifest.devDependencies,
      "@expressthat-auth/test-config": "workspace:*",
      "@expressthat-auth/typescript-config": "workspace:*",
      "@vitest/coverage-v8": "4.1.10",
      vitest: "4.1.10",
    },
  };

  return {
    changes: [
      {
        content: `${JSON.stringify(updatedManifest, undefined, 2)}\n`,
        mode: "replace",
        path: `${root}/package.json`,
      },
      {
        content: routeDocumentation(name),
        mode: "create",
        path: `${root}/docs/routes/${name}.md`,
      },
      {
        content:
          '{\n  "extends": "@expressthat-auth/typescript-config/library.json",\n' +
          '  "include": ["src/**/*.ts", "test/**/*.ts", "vitest.config.ts"]\n}\n',
        mode: "ensure",
        path: `${root}/tsconfig.json`,
      },
      {
        content:
          'import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";\n\n' +
          "export default createUnitTestConfig();\n",
        mode: "ensure",
        path: `${root}/vitest.config.ts`,
      },
      {
        content: routeSource(name),
        mode: "create",
        path: `${root}/src/routes/${name}.ts`,
      },
      {
        content: routeTest(name),
        mode: "create",
        path: `${root}/test/routes/${name}.test.ts`,
      },
    ],
    summary: `Created GET /${name} contract in @expressthat-auth/${application}.`,
  };
}
