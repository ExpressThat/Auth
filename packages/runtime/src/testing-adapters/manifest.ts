import {
  AdapterIdentifier,
  type CapabilityRequirement,
  RUNTIME_DEPENDENCY_CAPABILITIES,
  RuntimeCapabilityManifest,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
  type ValidatedCapabilityComposition,
  validateCapabilityComposition,
} from "../index.js";

const capabilities = Object.freeze(
  Object.values(RUNTIME_DEPENDENCY_CAPABILITIES).filter(
    (capability) => !capability.equals(RUNTIME_DEPENDENCY_CAPABILITIES.passwordHashing),
  ),
);

function stateFor(capability: (typeof capabilities)[number]):
  | Readonly<{ kind: "stateless" }>
  | Readonly<{
      coordination: "process";
      durability: "ephemeral";
      kind: "stateful";
    }> {
  if (
    capability.equals(RUNTIME_DEPENDENCY_CAPABILITIES.authenticatedEncryption) ||
    capability.equals(RUNTIME_DEPENDENCY_CAPABILITIES.signing)
  ) {
    return { kind: "stateless" };
  }
  return { coordination: "process", durability: "ephemeral", kind: "stateful" };
}

export const TEST_RUNTIME_CAPABILITY_MANIFEST = RuntimeCapabilityManifest.create({
  adapter: AdapterIdentifier.parse("test/in-memory-runtime"),
  adapterVersion: SemanticVersion.parse("0.0.0"),
  capabilities: capabilities.map((capability) => ({
    capability,
    failureBehavior: "reject-operation",
    healthBehavior: "not-applicable",
    residency: "operator-defined",
    state: stateFor(capability),
  })),
  configurationSchema: {
    digest: SchemaDigest.parse("0".repeat(64)),
    identifier: SchemaIdentifier.parse("test-memory.config"),
    version: SchemaVersion.parse(1),
  },
  contractVersion: SchemaVersion.parse(1),
  node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
  profiles: ["test"],
});

function requirement(capability: (typeof capabilities)[number]): CapabilityRequirement {
  return {
    capability,
    residency: "operator-defined",
    state: "any",
  };
}

export function createTestRuntimeCapabilityComposition(): ValidatedCapabilityComposition {
  return validateCapabilityComposition({
    bindings: capabilities.map((capability) => ({
      capability,
      manifest: TEST_RUNTIME_CAPABILITY_MANIFEST,
    })),
    profile: "test",
    requirements: capabilities.map(requirement),
    runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
  });
}
