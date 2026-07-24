import { RuntimeCapabilityManifest } from "./capability-manifest.js";
import { ValidatedCapabilityComposition } from "./capability-validation.js";
import type { RuntimeCapability } from "./capability-values.js";
import { RUNTIME_DEPENDENCY_CAPABILITIES } from "./dependency-capabilities.js";
import type {
  BoundRuntimeProvider,
  RuntimeDependencyCompositionInput,
  RuntimeDependencyValues,
} from "./dependency-model.js";

export type RuntimeDependencyName =
  | "authenticated-encryption"
  | "cache-state"
  | "capabilities"
  | "certificate-automation"
  | "clock"
  | "dns-automation"
  | "durable-queue"
  | "frontend-deployment"
  | "identifiers"
  | "key-management"
  | "object-storage"
  | "observability"
  | "password-hasher"
  | "random"
  | "secret-storage"
  | "signing";
export type RuntimeDependencyCompositionCode = "invalid-dependency" | "unvalidated-binding";

export class RuntimeDependencyCompositionError extends Error {
  public readonly code: RuntimeDependencyCompositionCode;
  public readonly dependency: RuntimeDependencyName;

  public constructor(code: RuntimeDependencyCompositionCode, dependency: RuntimeDependencyName) {
    super(`Runtime dependency composition failed (${code}).`);
    this.name = "RuntimeDependencyCompositionError";
    this.code = code;
    this.dependency = dependency;
  }

  public toJSON(): Readonly<{
    code: RuntimeDependencyCompositionCode;
    dependency: RuntimeDependencyName;
  }> {
    return { code: this.code, dependency: this.dependency };
  }
}

function hasMethods(value: unknown, methods: readonly string[]): boolean {
  if (value === null || (typeof value !== "object" && typeof value !== "function")) {
    return false;
  }
  return methods.every((method) => typeof Reflect.get(value, method) === "function");
}

function requireMethods(
  value: unknown,
  methods: readonly string[],
  dependency: RuntimeDependencyName,
): void {
  if (!hasMethods(value, methods)) {
    throw new RuntimeDependencyCompositionError("invalid-dependency", dependency);
  }
}

function requireBinding<TProvider>(
  composition: ValidatedCapabilityComposition,
  capability: RuntimeCapability,
  binding: BoundRuntimeProvider<TProvider>,
  methods: readonly string[],
  dependency: RuntimeDependencyName,
): TProvider {
  const selected = composition.manifestFor(capability);
  if (!(binding.manifest instanceof RuntimeCapabilityManifest) || selected !== binding.manifest) {
    throw new RuntimeDependencyCompositionError("unvalidated-binding", dependency);
  }
  requireMethods(binding.provider, methods, dependency);
  return binding.provider;
}

export class RuntimeDependencySet implements RuntimeDependencyValues {
  public readonly authenticatedEncryption: RuntimeDependencyValues["authenticatedEncryption"];
  public readonly cacheState: RuntimeDependencyValues["cacheState"];
  public readonly certificateAutomation: RuntimeDependencyValues["certificateAutomation"];
  public readonly clock: RuntimeDependencyValues["clock"];
  public readonly dnsAutomation: RuntimeDependencyValues["dnsAutomation"];
  public readonly durableQueue: RuntimeDependencyValues["durableQueue"];
  public readonly frontendDeployment: RuntimeDependencyValues["frontendDeployment"];
  public readonly identifiers: RuntimeDependencyValues["identifiers"];
  public readonly keyManagement: RuntimeDependencyValues["keyManagement"];
  public readonly objectStorage: RuntimeDependencyValues["objectStorage"];
  public readonly observability: RuntimeDependencyValues["observability"];
  public readonly passwordHasher: RuntimeDependencyValues["passwordHasher"];
  public readonly random: RuntimeDependencyValues["random"];
  public readonly secretStorage: RuntimeDependencyValues["secretStorage"];
  public readonly signing: RuntimeDependencyValues["signing"];

  private constructor(values: RuntimeDependencyValues) {
    this.authenticatedEncryption = values.authenticatedEncryption;
    this.cacheState = values.cacheState;
    this.certificateAutomation = values.certificateAutomation;
    this.clock = values.clock;
    this.dnsAutomation = values.dnsAutomation;
    this.durableQueue = values.durableQueue;
    this.frontendDeployment = values.frontendDeployment;
    this.identifiers = values.identifiers;
    this.keyManagement = values.keyManagement;
    this.objectStorage = values.objectStorage;
    this.observability = values.observability;
    this.passwordHasher = values.passwordHasher;
    this.random = values.random;
    this.secretStorage = values.secretStorage;
    this.signing = values.signing;
    Object.freeze(this);
  }

  public static compose(input: RuntimeDependencyCompositionInput): RuntimeDependencySet {
    if (!(input.capabilities instanceof ValidatedCapabilityComposition)) {
      throw new RuntimeDependencyCompositionError("invalid-dependency", "capabilities");
    }
    requireMethods(input.clock, ["now"], "clock");
    requireMethods(input.identifiers, ["next"], "identifiers");
    requireMethods(input.random, ["bytes"], "random");
    return new RuntimeDependencySet(composeProviderValues(input));
  }

  public toJSON(): Readonly<{ redacted: true }> {
    return { redacted: true };
  }
}

export function composeRuntimeDependencies(
  input: RuntimeDependencyCompositionInput,
): RuntimeDependencySet {
  return RuntimeDependencySet.compose(input);
}

function composeProviderValues(
  input: RuntimeDependencyCompositionInput,
): Omit<RuntimeDependencyValues, "clock" | "identifiers" | "random"> &
  Pick<RuntimeDependencyCompositionInput, "clock" | "identifiers" | "random"> {
  const capability = RUNTIME_DEPENDENCY_CAPABILITIES;
  return {
    authenticatedEncryption: requireBinding(
      input.capabilities,
      capability.authenticatedEncryption,
      input.authenticatedEncryption,
      ["decrypt", "encrypt"],
      "authenticated-encryption",
    ),
    cacheState: requireBinding(
      input.capabilities,
      capability.cacheState,
      input.cacheState,
      ["compareAndSet", "delete", "get", "health", "increment", "put"],
      "cache-state",
    ),
    certificateAutomation: requireBinding(
      input.capabilities,
      capability.certificateAutomation,
      input.certificateAutomation,
      ["health", "issue", "renew", "revoke", "status"],
      "certificate-automation",
    ),
    clock: input.clock,
    dnsAutomation: requireBinding(
      input.capabilities,
      capability.dnsAutomation,
      input.dnsAutomation,
      ["health", "prepare", "remove", "verify"],
      "dns-automation",
    ),
    durableQueue: requireBinding(
      input.capabilities,
      capability.durableQueue,
      input.durableQueue,
      ["acknowledge", "deadLetter", "health", "publish", "receive", "renewLease", "retry"],
      "durable-queue",
    ),
    frontendDeployment: requireBinding(
      input.capabilities,
      capability.frontendDeployment,
      input.frontendDeployment,
      ["deploy", "health", "remove", "rollback", "status", "verify"],
      "frontend-deployment",
    ),
    identifiers: input.identifiers,
    keyManagement: requireBinding(
      input.capabilities,
      capability.keyManagement,
      input.keyManagement,
      ["publish", "retire", "rotate", "sign", "unwrap", "verify", "wrap"],
      "key-management",
    ),
    objectStorage: requireBinding(
      input.capabilities,
      capability.objectStorage,
      input.objectStorage,
      ["delete", "get", "health", "put", "signAccess"],
      "object-storage",
    ),
    observability: requireBinding(
      input.capabilities,
      capability.observability,
      input.observability,
      ["health", "log", "metric", "startSpan"],
      "observability",
    ),
    passwordHasher: requireBinding(
      input.capabilities,
      capability.passwordHashing,
      input.passwordHasher,
      ["hash", "verify"],
      "password-hasher",
    ),
    random: input.random,
    secretStorage: requireBinding(
      input.capabilities,
      capability.secretStorage,
      input.secretStorage,
      ["create", "disable", "metadata", "resolve", "rotate"],
      "secret-storage",
    ),
    signing: requireBinding(
      input.capabilities,
      capability.signing,
      input.signing,
      ["sign", "verify"],
      "signing",
    ),
  };
}
