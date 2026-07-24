import { type NodeRuntimeSupportInput, RuntimeCapabilityManifest } from "./capability-manifest.js";

export type InfrastructureAdapterCategory =
  | "cache"
  | "certificate"
  | "deployment"
  | "dns"
  | "key-management"
  | "object-storage"
  | "observability"
  | "queue"
  | "secret";
export type ContainerArchitecture = "amd64" | "arm64";
export type OperatingSystem = "darwin" | "linux" | "win32";

export interface OperatorRuntimePlatformInput {
  readonly containerArchitecture: ContainerArchitecture;
  readonly externalCapabilities: readonly string[];
  readonly operatingSystem: OperatingSystem;
}

export interface OperatorAdapterRegistrationInput {
  readonly category: InfrastructureAdapterCategory;
  readonly manifest: RuntimeCapabilityManifest;
  readonly packageName: string;
  readonly runtimeSupport: {
    readonly containerArchitectures: readonly ContainerArchitecture[];
    readonly externalCapabilities: readonly string[];
    readonly node: NodeRuntimeSupportInput;
    readonly operatingSystems: readonly OperatingSystem[];
  };
}

export type OperatorAdapterRegistrationCode =
  | "duplicate-runtime-support"
  | "invalid-category"
  | "category-manifest-mismatch"
  | "invalid-external-capability"
  | "invalid-manifest"
  | "invalid-node-range"
  | "invalid-package-name"
  | "invalid-runtime-support"
  | "missing-runtime-support"
  | "node-manifest-mismatch";

const EXTERNAL_CAPABILITY_PATTERN =
  /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)+$/u;
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
const CATEGORY_CAPABILITIES: Readonly<
  Record<InfrastructureAdapterCategory, readonly [string, ...string[]]>
> = {
  cache: ["infrastructure/cache-state"],
  certificate: ["infrastructure/certificate-automation"],
  deployment: ["infrastructure/deployment-automation"],
  dns: ["infrastructure/dns-automation"],
  "key-management": [
    "security/key-management",
    "security/signing",
    "security/authenticated-encryption",
  ],
  "object-storage": ["infrastructure/object-storage"],
  observability: ["infrastructure/observability"],
  queue: ["infrastructure/durable-queue"],
  secret: ["infrastructure/secret-storage"],
};

export class OperatorAdapterRegistrationError extends Error {
  public readonly code: OperatorAdapterRegistrationCode;

  public constructor(code: OperatorAdapterRegistrationCode) {
    super(`Operator adapter registration is invalid (${code}).`);
    this.name = "OperatorAdapterRegistrationError";
    this.code = code;
  }

  public toJSON(): Readonly<{ code: OperatorAdapterRegistrationCode }> {
    return { code: this.code };
  }
}

export class OperatorAdapterRegistration {
  public readonly manifest: RuntimeCapabilityManifest;
  readonly #runtimeSupport: OperatorAdapterRegistrationInput["runtimeSupport"];

  private constructor(input: OperatorAdapterRegistrationInput) {
    this.manifest = input.manifest;
    this.#runtimeSupport = Object.freeze({
      containerArchitectures: Object.freeze([...input.runtimeSupport.containerArchitectures]),
      externalCapabilities: Object.freeze([...input.runtimeSupport.externalCapabilities]),
      node: Object.freeze({ ...input.runtimeSupport.node }),
      operatingSystems: Object.freeze([...input.runtimeSupport.operatingSystems]),
    });
    Object.freeze(this);
  }

  public static create(input: OperatorAdapterRegistrationInput): OperatorAdapterRegistration {
    validateIdentity(input);
    validateRuntimeSupport(input);
    return new OperatorAdapterRegistration(input);
  }

  public supports(platform: OperatorRuntimePlatformInput): boolean {
    const available = new Set(platform.externalCapabilities);
    return (
      this.#runtimeSupport.containerArchitectures.includes(platform.containerArchitecture) &&
      this.#runtimeSupport.operatingSystems.includes(platform.operatingSystem) &&
      this.#runtimeSupport.externalCapabilities.every((required) => available.has(required))
    );
  }

  public toJSON(): Readonly<{ redacted: true }> {
    return { redacted: true };
  }
}

function validateIdentity(input: OperatorAdapterRegistrationInput): void {
  if (!CATEGORIES.includes(input.category)) {
    throw new OperatorAdapterRegistrationError("invalid-category");
  }
  const prefix = `@expressthat-auth/${input.category}-`;
  const implementation = input.packageName.slice(prefix.length);
  if (
    !input.packageName.startsWith(prefix) ||
    input.packageName.length > 160 ||
    implementation.length === 0 ||
    !/^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u.test(implementation)
  ) {
    throw new OperatorAdapterRegistrationError("invalid-package-name");
  }
  if (!(input.manifest instanceof RuntimeCapabilityManifest)) {
    throw new OperatorAdapterRegistrationError("invalid-manifest");
  }
  const allowed = CATEGORY_CAPABILITIES[input.category];
  const declared = input.manifest.capabilities.map((entry) => entry.capability.toString());
  if (!declared.includes(allowed[0])) {
    throw new OperatorAdapterRegistrationError("category-manifest-mismatch");
  }
  if (declared.some((capability) => !allowed.includes(capability))) {
    throw new OperatorAdapterRegistrationError("category-manifest-mismatch");
  }
}

function validateRuntimeSupport(input: OperatorAdapterRegistrationInput): void {
  const support = input.runtimeSupport;
  if (support.containerArchitectures.length === 0 || support.operatingSystems.length === 0) {
    throw new OperatorAdapterRegistrationError("missing-runtime-support");
  }
  if (
    support.containerArchitectures.some((value) => !["amd64", "arm64"].includes(value)) ||
    support.operatingSystems.some((value) => !["darwin", "linux", "win32"].includes(value))
  ) {
    throw new OperatorAdapterRegistrationError("invalid-runtime-support");
  }
  for (const values of [
    support.containerArchitectures,
    support.externalCapabilities,
    support.operatingSystems,
  ]) {
    if (new Set(values).size !== values.length) {
      throw new OperatorAdapterRegistrationError("duplicate-runtime-support");
    }
  }
  if (
    support.node.runtime !== "node" ||
    !Number.isSafeInteger(support.node.minimumMajor) ||
    !Number.isSafeInteger(support.node.maximumMajorExclusive) ||
    support.node.minimumMajor < 1 ||
    support.node.maximumMajorExclusive <= support.node.minimumMajor
  ) {
    throw new OperatorAdapterRegistrationError("invalid-node-range");
  }
  if (
    support.node.minimumMajor !== input.manifest.node.minimumMajor ||
    support.node.maximumMajorExclusive !== input.manifest.node.maximumMajorExclusive
  ) {
    throw new OperatorAdapterRegistrationError("node-manifest-mismatch");
  }
  if (
    support.externalCapabilities.some(
      (capability) => capability.length > 96 || !EXTERNAL_CAPABILITY_PATTERN.test(capability),
    )
  ) {
    throw new OperatorAdapterRegistrationError("invalid-external-capability");
  }
}
