import { describe, expect, it } from "vitest";
import {
  AdapterIdentifier,
  RuntimeCapability,
  RuntimeCapabilityManifest,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
} from "../src/index.js";
import { manifest, queueCapability } from "./capability-test-fixture.js";

function replace(object: object, property: string, value: unknown): void {
  Object.defineProperty(object, property, { configurable: true, value });
}

describe("runtime capability values", () => {
  it("provides canonical machine-readable values", () => {
    const adapter = AdapterIdentifier.parse("community/durable.queue");
    const schema = SchemaIdentifier.parse("queue.config");
    const digest = SchemaDigest.parse("a".repeat(64));
    const version = SchemaVersion.parse(3);
    const semanticVersion = SemanticVersion.parse("1.2.3-beta.1+build.4");

    expect(RuntimeCapability.parse("infrastructure/durable-queue").equals(queueCapability)).toBe(
      true,
    );
    expect(RuntimeCapability.parse("infrastructure/cache").equals(queueCapability)).toBe(false);
    expect(queueCapability.toJSON()).toBe(queueCapability.toString());
    expect(adapter.toJSON()).toBe(adapter.toString());
    expect(schema.toJSON()).toBe(schema.toString());
    expect(digest.toJSON()).toBe(digest.toString());
    expect(version.toJSON()).toBe(3);
    expect(version.valueOf()).toBe(3);
    expect(semanticVersion.toJSON()).toBe(semanticVersion.toString());
  });

  it.each([
    () => RuntimeCapability.parse("missing-namespace"),
    () => RuntimeCapability.parse("UPPER/value"),
    () => RuntimeCapability.parse(`scope/${"x".repeat(100)}`),
    () => RuntimeCapability.parse(1),
    () => AdapterIdentifier.parse("missing-namespace"),
    () => AdapterIdentifier.parse(`scope/${"x".repeat(130)}`),
    () => SchemaIdentifier.parse("contains/slash"),
    () => SchemaIdentifier.parse(`s${"x".repeat(100)}`),
    () => SchemaDigest.parse("A".repeat(64)),
    () => SchemaDigest.parse("a".repeat(63)),
    () => SchemaVersion.parse(0),
    () => SchemaVersion.parse(1.5),
    () => SchemaVersion.parse("1"),
    () => SemanticVersion.parse("01.2.3"),
    () => SemanticVersion.parse(`1.0.0+${"x".repeat(130)}`),
    () => SemanticVersion.parse(1),
  ])("rejects malformed capability metadata", (operation) => {
    expect(operation).toThrow(TypeError);
  });
});

describe("runtime capability manifests", () => {
  it("copies, freezes, locates, versions, and redacts declarations", () => {
    const selected = manifest();
    const declaration = selected.declarationFor(queueCapability);

    expect(declaration?.state.kind).toBe("stateful");
    expect(
      selected.declarationFor(RuntimeCapability.parse("infrastructure/missing")),
    ).toBeUndefined();
    expect(selected.adapterVersion.toString()).toBe("1.2.3");
    expect(Number(selected.contractVersion)).toBe(1);
    expect(selected.secretSchema?.identifier.toString()).toBe("durable-state.secrets");
    expect(selected.toJSON()).toEqual({
      adapter: "reference/durable-state",
      redacted: true,
    });
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Object.isFrozen(selected.capabilities)).toBe(true);
    expect(Object.isFrozen(declaration?.state)).toBe(true);
  });

  it("supports stateless declarations without a secret schema", () => {
    const selected = RuntimeCapabilityManifest.create({
      adapter: AdapterIdentifier.parse("reference/password"),
      adapterVersion: SemanticVersion.parse("0.1.0"),
      capabilities: [
        {
          capability: RuntimeCapability.parse("security/password-hashing"),
          failureBehavior: "operation-defined",
          healthBehavior: "not-applicable",
          residency: "operator-defined",
          state: { kind: "stateless" },
        },
      ],
      configurationSchema: {
        digest: SchemaDigest.parse("3".repeat(64)),
        identifier: SchemaIdentifier.parse("password.config"),
        version: SchemaVersion.parse(1),
      },
      contractVersion: SchemaVersion.parse(1),
      node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
      profiles: ["test"],
    });

    expect(selected.capabilities[0]?.state).toEqual({ kind: "stateless" });
    expect(selected.secretSchema).toBeUndefined();
  });

  it("rejects forged, empty, duplicate, or incompatible declarations", () => {
    const valid = structuredClone({
      adapter: AdapterIdentifier.parse("reference/cache"),
      adapterVersion: SemanticVersion.parse("1.0.0"),
      capabilities: [
        {
          capability: cacheCapability(),
          failureBehavior: "reject-operation" as const,
          healthBehavior: "readiness" as const,
          residency: "operator-defined" as const,
          state: { kind: "stateless" as const },
        },
      ],
      configurationSchema: {
        digest: SchemaDigest.parse("4".repeat(64)),
        identifier: SchemaIdentifier.parse("cache.config"),
        version: SchemaVersion.parse(1),
      },
      contractVersion: SchemaVersion.parse(1),
      node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" as const },
      profiles: ["test" as const],
    });

    expect(() => RuntimeCapabilityManifest.create(valid)).toThrow(TypeError);
    expect(() =>
      RuntimeCapabilityManifest.create({
        ...manifestInput(),
        capabilities: [],
      }),
    ).toThrow(TypeError);
    expect(() =>
      RuntimeCapabilityManifest.create({
        ...manifestInput(),
        capabilities: [...manifestInput().capabilities, ...manifestInput().capabilities],
      }),
    ).toThrow(TypeError);
    expect(() =>
      RuntimeCapabilityManifest.create({
        ...manifestInput(),
        profiles: ["test", "test"],
      }),
    ).toThrow(TypeError);
  });

  it("rejects hostile runtime, profile, schema, and capability fields", () => {
    for (const [property, value] of [
      ["adapterVersion", {}],
      ["contractVersion", {}],
      ["profiles", ["unknown"]],
      ["node", { maximumMajorExclusive: 24, minimumMajor: 24, runtime: "node" }],
      ["configurationSchema", { digest: {}, identifier: {}, version: {} }],
    ] as const) {
      const input = manifestInput();
      replace(input, property, value);
      expect(() => RuntimeCapabilityManifest.create(input)).toThrow(TypeError);
    }

    for (const [property, value] of [
      ["capability", {}],
      ["failureBehavior", "ignore"],
      ["healthBehavior", "unmonitored"],
      ["residency", "global"],
      ["state", { kind: "unknown" }],
      ["state", { coordination: "local", durability: "durable", kind: "stateful" }],
      ["state", { coordination: "shared", durability: "temporary", kind: "stateful" }],
    ] as const) {
      const input = manifestInput();
      replace(input.capabilities[0] ?? {}, property, value);
      expect(() => RuntimeCapabilityManifest.create(input)).toThrow(TypeError);
    }
  });
});

function cacheCapability(): RuntimeCapability {
  return RuntimeCapability.parse("infrastructure/cache-state");
}

function manifestInput(): Parameters<typeof RuntimeCapabilityManifest.create>[0] {
  const selected = manifest();
  const base = {
    adapter: selected.adapter,
    adapterVersion: selected.adapterVersion,
    capabilities: selected.capabilities.map((entry) => ({
      ...entry,
      state: { ...entry.state },
    })),
    configurationSchema: selected.configurationSchema,
    contractVersion: selected.contractVersion,
    node: selected.node,
    profiles: selected.profiles,
  };
  if (selected.secretSchema === undefined) {
    return base;
  }
  return {
    ...base,
    secretSchema: selected.secretSchema,
  };
}
