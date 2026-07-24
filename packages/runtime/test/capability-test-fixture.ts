import {
  AdapterIdentifier,
  type CapabilityCompositionInput,
  type CapabilityRequirement,
  RuntimeCapability,
  RuntimeCapabilityManifest,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
} from "../src/index.js";

const CONFIGURATION_DIGEST = "1".repeat(64);
const SECRET_DIGEST = "2".repeat(64);

export const queueCapability = RuntimeCapability.parse("infrastructure/durable-queue");
export const cacheCapability = RuntimeCapability.parse("infrastructure/cache-state");

export function manifest(
  overrides: Readonly<{
    adapter?: AdapterIdentifier;
    capability?: RuntimeCapability;
    coordination?: "process" | "shared";
    durability?: "durable" | "ephemeral";
    profiles?: readonly ("hosted" | "local-development" | "self-hosted" | "test")[];
    residency?: "operator-defined" | "verified-european";
  }> = {},
): RuntimeCapabilityManifest {
  return RuntimeCapabilityManifest.create({
    adapter: overrides.adapter ?? AdapterIdentifier.parse("reference/durable-state"),
    adapterVersion: SemanticVersion.parse("1.2.3"),
    capabilities: [
      {
        capability: overrides.capability ?? queueCapability,
        failureBehavior: "reject-operation",
        healthBehavior: "startup-and-readiness",
        residency: overrides.residency ?? "verified-european",
        state: {
          coordination: overrides.coordination ?? "shared",
          durability: overrides.durability ?? "durable",
          kind: "stateful",
        },
      },
    ],
    configurationSchema: {
      digest: SchemaDigest.parse(CONFIGURATION_DIGEST),
      identifier: SchemaIdentifier.parse("durable-state.config"),
      version: SchemaVersion.parse(2),
    },
    contractVersion: SchemaVersion.parse(1),
    node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
    profiles: overrides.profiles ?? ["hosted", "self-hosted"],
    secretSchema: {
      digest: SchemaDigest.parse(SECRET_DIGEST),
      identifier: SchemaIdentifier.parse("durable-state.secrets"),
      version: SchemaVersion.parse(1),
    },
  });
}

export function requirement(
  overrides: Readonly<Partial<CapabilityRequirement>> = {},
): CapabilityRequirement {
  return {
    capability: overrides.capability ?? queueCapability,
    residency: overrides.residency ?? "verified-european",
    state: overrides.state ?? "durable-shared",
  };
}

export function composition(
  overrides: Readonly<Partial<CapabilityCompositionInput>> = {},
): CapabilityCompositionInput {
  const selectedManifest = manifest();
  return {
    bindings: overrides.bindings ?? [{ capability: queueCapability, manifest: selectedManifest }],
    profile: overrides.profile ?? "hosted",
    requirements: overrides.requirements ?? [requirement()],
    runtime: overrides.runtime ?? { major: 24, minor: 18, patch: 0, runtime: "node" },
  };
}
