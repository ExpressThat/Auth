import { describe, expect, it } from "vitest";
import { AdapterIdentifier, CapabilityValidationError } from "../src/index.js";
import {
  OperatorAdapterRegistration,
  OperatorAdapterRegistry,
  OperatorAdapterRegistryError,
  OperatorAdapterSelection,
} from "../src/operator.js";
import { manifest, queueCapability, requirement } from "./capability-test-fixture.js";

function selection(
  adapter = AdapterIdentifier.parse("reference/durable-state"),
  containerArchitecture: "amd64" | "arm64" = "amd64",
): OperatorAdapterSelection {
  return OperatorAdapterSelection.create({
    bindings: [{ adapter, capability: queueCapability }],
    platform: {
      containerArchitecture,
      externalCapabilities: ["network/tls"],
      operatingSystem: "linux",
    },
    profile: "self-hosted",
    runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
  });
}

function registration(selectedManifest = manifest()): OperatorAdapterRegistration {
  return OperatorAdapterRegistration.create({
    category: "queue",
    manifest: selectedManifest,
    packageName: "@expressthat-auth/queue-reference",
    runtimeSupport: {
      containerArchitectures: ["amd64"],
      externalCapabilities: ["network/tls"],
      node: selectedManifest.node,
      operatingSystems: ["linux"],
    },
  });
}

function replace(object: object, property: string, value: unknown): void {
  Object.defineProperty(object, property, { configurable: true, value });
}

describe("operator adapter registry", () => {
  it("resolves configured identifiers through registered manifests", () => {
    const selectedManifest = manifest();
    const registry = OperatorAdapterRegistry.create([registration(selectedManifest)]);
    const resolved = registry.resolve(selection(), [requirement()]);

    expect(resolved.manifestFor(queueCapability)).toBe(selectedManifest);
    expect(JSON.stringify(registry)).toBe('{"adapters":1,"redacted":true}');
  });

  it("rejects empty, forged, and duplicate registry entries", () => {
    expect(() => OperatorAdapterRegistry.create([])).toThrowError(
      expect.objectContaining({ code: "empty-registry" }),
    );

    const forged = [registration()];
    replace(forged, "0", {});
    expect(() => OperatorAdapterRegistry.create(forged)).toThrowError(
      expect.objectContaining({ code: "invalid-registration" }),
    );

    const duplicate = registration();
    const error = capture(() => OperatorAdapterRegistry.create([duplicate, duplicate]));
    expect(error.code).toBe("duplicate-adapter");
    expect(JSON.stringify(error)).toBe('{"code":"duplicate-adapter"}');
  });

  it("rejects unknown configured adapter identifiers without echoing them", () => {
    const registry = OperatorAdapterRegistry.create([registration()]);
    const unknown = AdapterIdentifier.parse("hostile/not-registered");
    const error = capture(() => registry.resolve(selection(unknown), [requirement()]));

    expect(error.code).toBe("unknown-adapter");
    expect(error.message).not.toContain(unknown.toString());
  });

  it("rejects values that did not pass operator selection validation", () => {
    const holder = { selection: selection() };
    replace(holder, "selection", {});

    expect(() =>
      OperatorAdapterRegistry.create([registration()]).resolve(holder.selection, [requirement()]),
    ).toThrowError(expect.objectContaining({ code: "invalid-selection" }));
  });

  it("delegates capability, profile, state, residency, and runtime policy", () => {
    const selectedManifest = manifest({
      adapter: AdapterIdentifier.parse("reference/cache-only"),
      capability: queueCapability,
    });
    const registry = OperatorAdapterRegistry.create([registration(selectedManifest)]);

    expect(() => registry.resolve(selection(selectedManifest.adapter), [])).toThrowError(
      expect.objectContaining({ code: "unexpected-binding" }),
    );
    expect(() =>
      registry.resolve(selection(selectedManifest.adapter), [
        requirement({ state: "durable-shared" }),
      ]),
    ).not.toThrow();
  });

  it("surfaces capability validation errors as their reviewed safe type", () => {
    const selectedManifest = manifest({ profiles: ["hosted"] });
    const registry = OperatorAdapterRegistry.create([registration(selectedManifest)]);

    expect(() => registry.resolve(selection(), [requirement()])).toThrow(CapabilityValidationError);
  });

  it("rejects a package that cannot run on the configured platform", () => {
    expect(() =>
      OperatorAdapterRegistry.create([registration()]).resolve(
        selection(AdapterIdentifier.parse("reference/durable-state"), "arm64"),
        [requirement()],
      ),
    ).toThrowError(expect.objectContaining({ code: "platform-incompatible" }));
  });
});

function capture(action: () => unknown): OperatorAdapterRegistryError {
  try {
    action();
  } catch (error: unknown) {
    if (error instanceof OperatorAdapterRegistryError) return error;
  }
  throw new Error("Expected operator adapter registry to fail.");
}
