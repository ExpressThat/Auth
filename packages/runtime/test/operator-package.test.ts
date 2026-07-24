import { describe, expect, it } from "vitest";
import { RuntimeCapability, RuntimeCapabilityManifest } from "../src/index.js";
import {
  OperatorAdapterRegistration,
  OperatorAdapterRegistrationError,
  type OperatorAdapterRegistrationInput,
} from "../src/operator.js";
import { manifest } from "./capability-test-fixture.js";

const CATEGORIES = [
  "cache",
  "certificate",
  "deployment",
  "dns",
  "key-management",
  "object-storage",
  "observability",
  "queue",
  "secret",
] as const;
const PRIMARY_CAPABILITY: Record<(typeof CATEGORIES)[number], string> = {
  cache: "infrastructure/cache-state",
  certificate: "infrastructure/certificate-automation",
  deployment: "infrastructure/deployment-automation",
  dns: "infrastructure/dns-automation",
  "key-management": "security/key-management",
  "object-storage": "infrastructure/object-storage",
  observability: "infrastructure/observability",
  queue: "infrastructure/durable-queue",
  secret: "infrastructure/secret-storage",
};

function input(category: (typeof CATEGORIES)[number] = "queue"): OperatorAdapterRegistrationInput {
  const selectedManifest = manifest({
    capability: RuntimeCapability.parse(PRIMARY_CAPABILITY[category]),
  });
  return {
    category,
    manifest: selectedManifest,
    packageName: `@expressthat-auth/${category}-reference`,
    runtimeSupport: {
      containerArchitectures: ["amd64", "arm64"],
      externalCapabilities: ["network/tls"],
      node: selectedManifest.node,
      operatingSystems: ["darwin", "linux", "win32"],
    },
  };
}

function replace(object: object, property: string, value: unknown): void {
  Object.defineProperty(object, property, { configurable: true, value });
}

describe("operator adapter package registration", () => {
  it.each(CATEGORIES)("accepts and redacts a %s package declaration", (category) => {
    const source = input(category);
    const registration = OperatorAdapterRegistration.create(source);
    replace(source.runtimeSupport, "externalCapabilities", []);

    expect(Object.isFrozen(registration)).toBe(true);
    expect(registration.manifest).toBe(source.manifest);
    expect(JSON.stringify(registration)).toBe('{"redacted":true}');
    expect(
      registration.supports({
        containerArchitecture: "arm64",
        externalCapabilities: ["network/tls", "filesystem/persistent"],
        operatingSystem: "linux",
      }),
    ).toBe(true);
  });

  it("reports unsupported architecture, operating system, and external capability", () => {
    const selected = input();
    replace(selected.runtimeSupport, "containerArchitectures", ["amd64"]);
    replace(selected.runtimeSupport, "operatingSystems", ["linux"]);
    const registration = OperatorAdapterRegistration.create(selected);

    expect(
      registration.supports({
        containerArchitecture: "amd64",
        externalCapabilities: ["network/tls"],
        operatingSystem: "linux",
      }),
    ).toBe(true);
    expect(
      registration.supports({
        containerArchitecture: "arm64",
        externalCapabilities: ["network/tls"],
        operatingSystem: "linux",
      }),
    ).toBe(false);
    expect(
      registration.supports({
        containerArchitecture: "amd64",
        externalCapabilities: ["network/tls"],
        operatingSystem: "win32",
      }),
    ).toBe(false);
    expect(
      registration.supports({
        containerArchitecture: "amd64",
        externalCapabilities: [],
        operatingSystem: "linux",
      }),
    ).toBe(false);
  });

  it.each([
    ["invalid-category", "category", "email"],
    ["invalid-package-name", "packageName", "@expressthat-auth/cache-reference"],
    ["invalid-package-name", "packageName", "@expressthat-auth/queue-"],
    ["invalid-package-name", "packageName", "@expressthat-auth/queue-BAD"],
    ["invalid-package-name", "packageName", `@expressthat-auth/queue-${"x".repeat(161)}`],
    ["invalid-manifest", "manifest", {}],
  ])("rejects %s identity metadata", (code, property, value) => {
    const selected = input();
    replace(selected, property, value);

    expect(() => OperatorAdapterRegistration.create(selected)).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  it("rejects a runtime manifest from another infrastructure category", () => {
    const selected = input("cache");
    replace(selected, "manifest", manifest());

    expect(() => OperatorAdapterRegistration.create(selected)).toThrowError(
      expect.objectContaining({ code: "category-manifest-mismatch" }),
    );
  });

  it("rejects an additional capability owned by another category", () => {
    const selected = input("key-management");
    const primary = selected.manifest.capabilities[0];
    if (primary === undefined) throw new Error("Expected a primary capability.");
    const mixed = RuntimeCapabilityManifest.create({
      adapter: selected.manifest.adapter,
      adapterVersion: selected.manifest.adapterVersion,
      capabilities: [
        primary,
        {
          ...primary,
          capability: RuntimeCapability.parse("infrastructure/durable-queue"),
        },
      ],
      configurationSchema: selected.manifest.configurationSchema,
      contractVersion: selected.manifest.contractVersion,
      node: selected.manifest.node,
      profiles: selected.manifest.profiles,
    });
    replace(selected, "manifest", mixed);

    expect(() => OperatorAdapterRegistration.create(selected)).toThrowError(
      expect.objectContaining({ code: "category-manifest-mismatch" }),
    );
  });

  it.each([
    ["missing-runtime-support", "containerArchitectures", []],
    ["missing-runtime-support", "operatingSystems", []],
    ["invalid-runtime-support", "containerArchitectures", ["other"]],
    ["invalid-runtime-support", "operatingSystems", ["other"]],
    ["duplicate-runtime-support", "containerArchitectures", ["amd64", "amd64"]],
    ["duplicate-runtime-support", "externalCapabilities", ["network/tls", "network/tls"]],
    ["duplicate-runtime-support", "operatingSystems", ["linux", "linux"]],
    ["invalid-external-capability", "externalCapabilities", ["not-namespaced"]],
    ["invalid-external-capability", "externalCapabilities", [`network/${"x".repeat(100)}`]],
  ])("rejects %s runtime list metadata", (code, property, value) => {
    const selected = input();
    replace(selected.runtimeSupport, property, value);

    expect(() => OperatorAdapterRegistration.create(selected)).toThrowError(
      expect.objectContaining({ code }),
    );
  });

  it.each([
    { maximumMajorExclusive: 27, minimumMajor: 0, runtime: "node" },
    { maximumMajorExclusive: 24, minimumMajor: 24, runtime: "node" },
    { maximumMajorExclusive: 27.5, minimumMajor: 24, runtime: "node" },
    { maximumMajorExclusive: 27, minimumMajor: 24.5, runtime: "node" },
    { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "other" },
  ])("rejects an invalid Node support range", (node) => {
    const selected = input();
    replace(selected.runtimeSupport, "node", node);

    expect(() => OperatorAdapterRegistration.create(selected)).toThrowError(
      expect.objectContaining({ code: "invalid-node-range" }),
    );
  });

  it("rejects package and runtime-manifest Node range drift", () => {
    const selected = input();
    replace(selected.runtimeSupport, "node", {
      maximumMajorExclusive: 28,
      minimumMajor: 25,
      runtime: "node",
    });
    const error = capture(() => OperatorAdapterRegistration.create(selected));

    expect(error.code).toBe("node-manifest-mismatch");
    expect(JSON.stringify(error)).toBe('{"code":"node-manifest-mismatch"}');
  });
});

function capture(action: () => unknown): OperatorAdapterRegistrationError {
  try {
    action();
  } catch (error: unknown) {
    if (error instanceof OperatorAdapterRegistrationError) return error;
  }
  throw new Error("Expected operator adapter registration to fail.");
}
