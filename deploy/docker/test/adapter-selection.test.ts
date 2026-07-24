import {
  AdapterIdentifier,
  RuntimeCapability,
  RuntimeCapabilityManifest,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
} from "@expressthat-auth/runtime";
import {
  OperatorAdapterRegistration,
  OperatorAdapterRegistryError,
} from "@expressthat-auth/runtime/operator";
import { describe, expect, it } from "vitest";
import { resolveDockerAdapterConfiguration } from "../src/adapter-selection.js";

const capability = RuntimeCapability.parse("infrastructure/durable-queue");
const adapter = AdapterIdentifier.parse("reference/durable-state");

function manifest(
  profiles: readonly ("hosted" | "self-hosted")[] = ["hosted", "self-hosted"],
): RuntimeCapabilityManifest {
  return RuntimeCapabilityManifest.create({
    adapter,
    adapterVersion: SemanticVersion.parse("1.0.0"),
    capabilities: [
      {
        capability,
        failureBehavior: "reject-operation",
        healthBehavior: "startup-and-readiness",
        residency: "verified-european",
        state: { coordination: "shared", durability: "durable", kind: "stateful" },
      },
    ],
    configurationSchema: {
      digest: SchemaDigest.parse("1".repeat(64)),
      identifier: SchemaIdentifier.parse("queue.config"),
      version: SchemaVersion.parse(1),
    },
    contractVersion: SchemaVersion.parse(1),
    node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
    profiles,
  });
}

function configuration(profile: "hosted" | "self-hosted", adapterId = adapter.toString()) {
  return {
    bindings: [{ adapter: adapterId, capability: capability.toString() }],
    platform: {
      containerArchitecture: "amd64",
      externalCapabilities: ["network/tls"],
      operatingSystem: "linux",
    },
    profile,
    runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
  };
}

function registration(selectedManifest = manifest()): OperatorAdapterRegistration {
  return OperatorAdapterRegistration.create({
    category: "queue",
    manifest: selectedManifest,
    packageName: "@expressthat-auth/queue-reference",
    runtimeSupport: {
      containerArchitectures: ["amd64", "arm64"],
      externalCapabilities: ["network/tls"],
      node: selectedManifest.node,
      operatingSystems: ["linux"],
    },
  });
}

const requirements = [
  { capability, residency: "verified-european", state: "durable-shared" },
] as const;

describe("Docker operator adapter composition", () => {
  it.each(["hosted", "self-hosted"] as const)(
    "resolves validated %s operator configuration",
    (profile) => {
      const selected = manifest();
      const composition = resolveDockerAdapterConfiguration(
        configuration(profile),
        [registration(selected)],
        requirements,
      );

      expect(composition.manifestFor(capability)).toBe(selected);
    },
  );

  it("fails closed when configuration selects an unavailable package", () => {
    expect(() =>
      resolveDockerAdapterConfiguration(
        configuration("self-hosted", "unknown/queue"),
        [registration()],
        requirements,
      ),
    ).toThrow(OperatorAdapterRegistryError);
  });

  it("enforces hosted and self-hosted capability policy after lookup", () => {
    expect(() =>
      resolveDockerAdapterConfiguration(
        configuration("self-hosted"),
        [registration(manifest(["hosted"]))],
        requirements,
      ),
    ).toThrowError(expect.objectContaining({ code: "profile-incompatible" }));
  });
});
