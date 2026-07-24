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
  OperatorAdapterRegistry,
  OperatorAdapterSelection,
} from "@expressthat-auth/runtime/operator";

const capability = RuntimeCapability.parse("infrastructure/durable-queue");
const manifest = RuntimeCapabilityManifest.create({
  adapter: AdapterIdentifier.parse("reference/durable-queue"),
  adapterVersion: SemanticVersion.parse("1.0.0"),
  capabilities: [
    {
      capability,
      failureBehavior: "reject-operation",
      healthBehavior: "startup-and-readiness",
      residency: "operator-defined",
      state: { coordination: "shared", durability: "durable", kind: "stateful" },
    },
  ],
  configurationSchema: {
    digest: SchemaDigest.parse("1".repeat(64)),
    identifier: SchemaIdentifier.parse("durable-queue.config"),
    version: SchemaVersion.parse(1),
  },
  contractVersion: SchemaVersion.parse(1),
  node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
  profiles: ["self-hosted"],
});

export const operatorRegistration = OperatorAdapterRegistration.create({
  category: "queue",
  manifest,
  packageName: "@expressthat-auth/queue-reference",
  runtimeSupport: {
    containerArchitectures: ["amd64"],
    externalCapabilities: ["network/tls"],
    node: manifest.node,
    operatingSystems: ["linux"],
  },
});
export const operatorRegistry = OperatorAdapterRegistry.create([operatorRegistration]);
export const operatorSelection = OperatorAdapterSelection.create({
  bindings: [{ adapter: manifest.adapter, capability }],
  platform: {
    containerArchitecture: "amd64",
    externalCapabilities: ["network/tls"],
    operatingSystem: "linux",
  },
  profile: "self-hosted",
  runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
});

OperatorAdapterSelection.create({
  bindings: [{ adapter: manifest.adapter, capability }],
  platform: {
    // @ts-expect-error -- unknown container architectures cannot enter selection.
    containerArchitecture: "s390x",
    externalCapabilities: [],
    operatingSystem: "linux",
  },
  profile: "self-hosted",
  runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
});
