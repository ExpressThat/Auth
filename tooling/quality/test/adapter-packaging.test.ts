import { describe, expect, it } from "vitest";
import { findAdapterPackagingViolations } from "../src/adapter-packaging.js";
import type {
  InfrastructureAdapterCategory,
  InfrastructureAdapterMetadata,
  Workspace,
} from "../src/boundary-model.js";
import { dependency, workspace } from "./boundary-fixtures.js";

const CATEGORIES: readonly InfrastructureAdapterCategory[] = [
  "cache",
  "certificate",
  "deployment",
  "dns",
  "key-management",
  "object-storage",
  "observability",
  "queue",
  "secret",
];

function metadata(
  category: InfrastructureAdapterCategory,
  overrides: Partial<InfrastructureAdapterMetadata["runtimeSupport"]> = {},
): InfrastructureAdapterMetadata {
  return {
    category,
    runtimeSupport: {
      containerArchitectures: overrides.containerArchitectures ?? ["amd64", "arm64"],
      externalCapabilities: overrides.externalCapabilities ?? ["network/tls"],
      node: overrides.node ?? { maximumMajorExclusive: 27, minimumMajor: 24 },
      operatingSystems: overrides.operatingSystems ?? ["linux"],
    },
  };
}

function adapter(
  basename: string,
  category: InfrastructureAdapterCategory,
  overrides: Partial<Workspace> = {},
): Workspace {
  return {
    ...workspace(
      `@expressthat-auth/${basename}`,
      "implementation",
      [dependency("@expressthat-auth/runtime")],
      [".", "./manifest"],
    ),
    infrastructureAdapter: metadata(category),
    path: `packages/providers/${basename}`,
    ...overrides,
  };
}

describe("infrastructure adapter packaging", () => {
  it.each(CATEGORIES)("accepts an independently packaged %s adapter", (category) => {
    expect(findAdapterPackagingViolations([adapter(`${category}-reference`, category)])).toEqual(
      [],
    );
  });

  it("reserves infrastructure category prefixes for declared adapters", () => {
    const reserved = adapter("queue-reference", "queue");
    const ordinary = adapter("email-reference", "queue");
    delete reserved.infrastructureAdapter;
    delete ordinary.infrastructureAdapter;

    expect(findAdapterPackagingViolations([reserved, ordinary])).toEqual([
      {
        code: "missing-adapter-metadata",
        message:
          "@expressthat-auth/queue-reference uses the reserved queue adapter prefix without infrastructure metadata.",
        path: "packages/providers/queue-reference/package.json",
      },
    ]);
  });

  it("rejects metadata outside a direct provider package", () => {
    const outside = adapter("queue-outside", "queue", { path: "packages/queue-outside" });
    const nested = adapter("queue-nested", "queue", {
      path: "packages/providers/queue/nested",
    });
    const root = adapter("queue-root", "queue", { path: "packages/providers/" });

    expect(
      findAdapterPackagingViolations([outside, nested, root]).map((item) => item.code),
    ).toEqual(["adapter-location", "adapter-location", "adapter-location"]);
  });

  it("binds package identity to one category and its directory", () => {
    const wrongName = adapter("queue-reference", "queue", {
      name: "@expressthat-auth/not-the-directory",
    });
    const wrongCategory = adapter("queue-reference", "cache");

    expect(
      findAdapterPackagingViolations([wrongName, wrongCategory]).map((item) => item.code),
    ).toEqual(["adapter-identity", "adapter-identity"]);
  });

  it("requires explicit root and manifest exports", () => {
    const missingBoth = adapter("queue-reference", "queue", {
      exports: new Set(),
    });

    expect(findAdapterPackagingViolations([missingBoth])).toEqual([
      {
        code: "adapter-export",
        message: "@expressthat-auth/queue-reference must explicitly export ..",
        path: "packages/providers/queue-reference/package.json",
      },
      {
        code: "adapter-export",
        message: "@expressthat-auth/queue-reference must explicitly export ./manifest.",
        path: "packages/providers/queue-reference/package.json",
      },
    ]);
  });

  it("requires the runtime contract as a production dependency", () => {
    const absent = adapter("queue-absent", "queue", { dependencies: [] });
    const development = adapter("queue-development", "queue", {
      dependencies: [dependency("@expressthat-auth/runtime", "devDependencies")],
    });

    expect(findAdapterPackagingViolations([absent, development]).map((item) => item.code)).toEqual([
      "adapter-runtime-contract",
      "adapter-runtime-contract",
    ]);
  });

  it("rejects empty Node ranges and duplicate runtime declarations", () => {
    const selected = adapter("queue-reference", "queue", {
      infrastructureAdapter: metadata("queue", {
        containerArchitectures: ["amd64", "amd64"],
        externalCapabilities: ["network/tls", "network/tls"],
        node: { maximumMajorExclusive: 24, minimumMajor: 24 },
        operatingSystems: ["linux", "linux"],
      }),
    });

    expect(findAdapterPackagingViolations([selected]).map((item) => item.code)).toEqual([
      "adapter-node-range",
      "adapter-runtime-duplicate",
      "adapter-runtime-duplicate",
      "adapter-runtime-duplicate",
    ]);
  });
});
