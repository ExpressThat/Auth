import {
  AdapterIdentifier,
  type BoundRuntimeProvider,
  RUNTIME_DEPENDENCY_CAPABILITIES,
  RuntimeCapabilityManifest,
  type RuntimeDependencyCompositionInput,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
  UuidV7Generator,
  validateCapabilityComposition,
} from "../src/index.js";
import { ControlledClock, SequenceRandomSource } from "../src/testing.js";

async function unavailable(): Promise<never> {
  throw new Error("Synthetic provider is not invoked by composition tests.");
}

function dependencyManifest(): RuntimeCapabilityManifest {
  return RuntimeCapabilityManifest.create({
    adapter: AdapterIdentifier.parse("test/runtime-dependencies"),
    adapterVersion: SemanticVersion.parse("1.0.0"),
    capabilities: Object.values(RUNTIME_DEPENDENCY_CAPABILITIES).map((capability) => ({
      capability,
      failureBehavior: "reject-operation",
      healthBehavior: "startup-and-readiness",
      residency: "operator-defined",
      state: { kind: "stateless" },
    })),
    configurationSchema: {
      digest: SchemaDigest.parse("5".repeat(64)),
      identifier: SchemaIdentifier.parse("runtime-dependencies.config"),
      version: SchemaVersion.parse(1),
    },
    contractVersion: SchemaVersion.parse(1),
    node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
    profiles: ["test"],
  });
}

function binding<TProvider>(
  provider: TProvider,
  manifest: RuntimeCapabilityManifest,
): BoundRuntimeProvider<TProvider> {
  return { manifest, provider };
}

export function runtimeDependencyInput(): RuntimeDependencyCompositionInput {
  const manifest = dependencyManifest();
  const capabilities = Object.values(RUNTIME_DEPENDENCY_CAPABILITIES);
  const clock = new ControlledClock(0);
  const random = new SequenceRandomSource([new Uint8Array(10)]);
  return {
    authenticatedEncryption: binding({ decrypt: unavailable, encrypt: unavailable }, manifest),
    cacheState: binding(
      {
        compareAndSet: unavailable,
        delete: unavailable,
        get: unavailable,
        health: unavailable,
        increment: unavailable,
        put: unavailable,
      },
      manifest,
    ),
    capabilities: validateCapabilityComposition({
      bindings: capabilities.map((capability) => ({ capability, manifest })),
      profile: "test",
      requirements: capabilities.map((capability) => ({
        capability,
        residency: "operator-defined",
        state: "any",
      })),
      runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
    }),
    certificateAutomation: binding(
      {
        health: unavailable,
        issue: unavailable,
        renew: unavailable,
        revoke: unavailable,
        status: unavailable,
      },
      manifest,
    ),
    clock,
    dnsAutomation: binding(
      {
        health: unavailable,
        prepare: unavailable,
        remove: unavailable,
        verify: unavailable,
      },
      manifest,
    ),
    durableQueue: binding(
      {
        acknowledge: unavailable,
        deadLetter: unavailable,
        health: unavailable,
        publish: unavailable,
        receive: unavailable,
        renewLease: unavailable,
        retry: unavailable,
      },
      manifest,
    ),
    frontendDeployment: binding(
      {
        deploy: unavailable,
        health: unavailable,
        remove: unavailable,
        rollback: unavailable,
        status: unavailable,
        verify: unavailable,
      },
      manifest,
    ),
    identifiers: new UuidV7Generator(clock, random),
    keyManagement: binding(
      {
        publish: unavailable,
        retire: unavailable,
        rotate: unavailable,
        sign: unavailable,
        unwrap: unavailable,
        verify: unavailable,
        wrap: unavailable,
      },
      manifest,
    ),
    objectStorage: binding(
      {
        delete: unavailable,
        get: unavailable,
        health: unavailable,
        put: unavailable,
        signAccess: unavailable,
      },
      manifest,
    ),
    observability: binding(
      {
        health: unavailable,
        log: unavailable,
        metric: unavailable,
        startSpan: unavailable,
      },
      manifest,
    ),
    passwordHasher: binding(
      {
        hash: unavailable,
        metadata: {
          adapterId: "test/runtime-dependencies",
          algorithm: "argon2id",
          policyId: "test",
        },
        verify: unavailable,
      },
      manifest,
    ),
    random,
    secretStorage: binding(
      {
        create: unavailable,
        disable: unavailable,
        metadata: unavailable,
        resolve: unavailable,
        rotate: unavailable,
      },
      manifest,
    ),
    signing: binding({ sign: unavailable, verify: unavailable }, manifest),
  };
}

export function unrelatedManifest(): RuntimeCapabilityManifest {
  return RuntimeCapabilityManifest.create({
    adapter: AdapterIdentifier.parse("test/unrelated"),
    adapterVersion: SemanticVersion.parse("1.0.0"),
    capabilities: [
      {
        capability: RUNTIME_DEPENDENCY_CAPABILITIES.signing,
        failureBehavior: "reject-operation",
        healthBehavior: "not-applicable",
        residency: "operator-defined",
        state: { kind: "stateless" },
      },
    ],
    configurationSchema: {
      digest: SchemaDigest.parse("6".repeat(64)),
      identifier: SchemaIdentifier.parse("unrelated.config"),
      version: SchemaVersion.parse(1),
    },
    contractVersion: SchemaVersion.parse(1),
    node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
    profiles: ["test"],
  });
}
