import {
  AdapterIdentifier,
  RuntimeCapability,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SemanticVersion,
} from "./capability-values.js";

export type DeploymentProfile = "hosted" | "local-development" | "self-hosted" | "test";
export type ResidencySupport = "operator-defined" | "verified-european";
export type FailureBehavior = "operation-defined" | "reject-operation";
export type HealthBehavior = "not-applicable" | "readiness" | "startup-and-readiness";
export type CapabilityState =
  | Readonly<{
      coordination: "process" | "shared";
      durability: "durable" | "ephemeral";
      kind: "stateful";
    }>
  | Readonly<{ kind: "stateless" }>;

export interface SchemaDescriptorInput {
  readonly digest: SchemaDigest;
  readonly identifier: SchemaIdentifier;
  readonly version: SchemaVersion;
}

export interface AdapterCapabilityInput {
  readonly capability: RuntimeCapability;
  readonly failureBehavior: FailureBehavior;
  readonly healthBehavior: HealthBehavior;
  readonly residency: ResidencySupport;
  readonly state: CapabilityState;
}

export interface NodeRuntimeSupportInput {
  readonly maximumMajorExclusive: number;
  readonly minimumMajor: number;
  readonly runtime: "node";
}

export interface RuntimeCapabilityManifestInput {
  readonly adapter: AdapterIdentifier;
  readonly adapterVersion: SemanticVersion;
  readonly capabilities: readonly AdapterCapabilityInput[];
  readonly configurationSchema: SchemaDescriptorInput;
  readonly contractVersion: SchemaVersion;
  readonly node: NodeRuntimeSupportInput;
  readonly profiles: readonly DeploymentProfile[];
  readonly secretSchema?: SchemaDescriptorInput;
}

function freezeSchema(input: SchemaDescriptorInput): Readonly<SchemaDescriptorInput> {
  if (
    !(input.identifier instanceof SchemaIdentifier) ||
    !(input.digest instanceof SchemaDigest) ||
    !(input.version instanceof SchemaVersion)
  ) {
    throw new TypeError("Adapter schema descriptors must use validated values.");
  }
  return Object.freeze({ ...input });
}

function freezeNodeSupport(input: NodeRuntimeSupportInput): Readonly<NodeRuntimeSupportInput> {
  if (
    input.runtime !== "node" ||
    !Number.isSafeInteger(input.minimumMajor) ||
    !Number.isSafeInteger(input.maximumMajorExclusive) ||
    input.minimumMajor < 1 ||
    input.maximumMajorExclusive <= input.minimumMajor
  ) {
    throw new TypeError("Adapter Node runtime support is invalid.");
  }
  return Object.freeze({ ...input });
}

function freezeCapability(input: AdapterCapabilityInput): Readonly<AdapterCapabilityInput> {
  if (!(input.capability instanceof RuntimeCapability)) {
    throw new TypeError("Adapter capabilities must use validated identifiers.");
  }
  if (
    !["operation-defined", "reject-operation"].includes(input.failureBehavior) ||
    !["not-applicable", "readiness", "startup-and-readiness"].includes(input.healthBehavior) ||
    !["operator-defined", "verified-european"].includes(input.residency)
  ) {
    throw new TypeError("Adapter capability behavior is invalid.");
  }
  if (input.state.kind === "stateful") {
    if (
      !["process", "shared"].includes(input.state.coordination) ||
      !["durable", "ephemeral"].includes(input.state.durability)
    ) {
      throw new TypeError("Adapter capability state is invalid.");
    }
    return Object.freeze({ ...input, state: Object.freeze({ ...input.state }) });
  }
  if (input.state.kind !== "stateless") {
    throw new TypeError("Adapter capability state is invalid.");
  }
  return Object.freeze({ ...input, state: Object.freeze({ kind: "stateless" }) });
}

export class RuntimeCapabilityManifest {
  public readonly adapter: AdapterIdentifier;
  public readonly adapterVersion: SemanticVersion;
  public readonly capabilities: readonly Readonly<AdapterCapabilityInput>[];
  public readonly configurationSchema: Readonly<SchemaDescriptorInput>;
  public readonly contractVersion: SchemaVersion;
  public readonly node: Readonly<NodeRuntimeSupportInput>;
  public readonly profiles: readonly DeploymentProfile[];
  public readonly secretSchema: Readonly<SchemaDescriptorInput> | undefined;

  private constructor(input: RuntimeCapabilityManifestInput) {
    this.adapter = input.adapter;
    this.adapterVersion = input.adapterVersion;
    this.capabilities = Object.freeze(input.capabilities.map(freezeCapability));
    this.configurationSchema = freezeSchema(input.configurationSchema);
    this.contractVersion = input.contractVersion;
    this.node = freezeNodeSupport(input.node);
    this.profiles = Object.freeze([...input.profiles]);
    this.secretSchema =
      input.secretSchema === undefined ? undefined : freezeSchema(input.secretSchema);
    Object.freeze(this);
  }

  public static create(input: RuntimeCapabilityManifestInput): RuntimeCapabilityManifest {
    if (!(input.adapter instanceof AdapterIdentifier)) {
      throw new TypeError("Adapter manifest must use a validated adapter identifier.");
    }
    if (
      !(input.adapterVersion instanceof SemanticVersion) ||
      !(input.contractVersion instanceof SchemaVersion)
    ) {
      throw new TypeError("Adapter manifest versions must use validated values.");
    }
    if (input.capabilities.length === 0 || input.profiles.length === 0) {
      throw new TypeError("Adapter manifest must declare capabilities and profiles.");
    }
    const capabilities = input.capabilities.map((entry) => entry.capability.toString());
    const profiles = [...input.profiles];
    if (
      profiles.some(
        (profile) => !["hosted", "local-development", "self-hosted", "test"].includes(profile),
      )
    ) {
      throw new TypeError("Adapter deployment profile is invalid.");
    }
    if (
      new Set(capabilities).size !== capabilities.length ||
      new Set(profiles).size !== profiles.length
    ) {
      throw new TypeError("Adapter manifest declarations must be unique.");
    }
    return new RuntimeCapabilityManifest(input);
  }

  public declarationFor(
    capability: RuntimeCapability,
  ): Readonly<AdapterCapabilityInput> | undefined {
    return this.capabilities.find((entry) => entry.capability.equals(capability));
  }

  public toJSON(): Readonly<{ adapter: string; redacted: true }> {
    return { adapter: this.adapter.toString(), redacted: true };
  }
}
