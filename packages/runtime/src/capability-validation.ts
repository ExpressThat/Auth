import type {
  AdapterCapabilityInput,
  DeploymentProfile,
  RuntimeCapabilityManifest,
} from "./capability-manifest.js";
import type { RuntimeCapability } from "./capability-values.js";

export type CapabilityValidationCode =
  | "duplicate-binding"
  | "duplicate-requirement"
  | "missing-capability"
  | "profile-incompatible"
  | "residency-incompatible"
  | "runtime-incompatible"
  | "state-incompatible"
  | "undeclared-capability"
  | "unexpected-binding";

export interface NodeRuntimeVersion {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly runtime: "node";
}

export interface CapabilityRequirement {
  readonly capability: RuntimeCapability;
  readonly residency: "operator-defined" | "verified-european";
  readonly state: "any" | "durable-shared";
}

export interface CapabilityBinding {
  readonly capability: RuntimeCapability;
  readonly manifest: RuntimeCapabilityManifest;
}

export interface CapabilityCompositionInput {
  readonly bindings: readonly CapabilityBinding[];
  readonly profile: DeploymentProfile;
  readonly requirements: readonly CapabilityRequirement[];
  readonly runtime: NodeRuntimeVersion;
}

export class CapabilityValidationError extends Error {
  public readonly capability: RuntimeCapability;
  public readonly code: CapabilityValidationCode;

  public constructor(code: CapabilityValidationCode, capability: RuntimeCapability) {
    super(`Runtime capability validation failed (${code}).`);
    this.name = "CapabilityValidationError";
    this.code = code;
    this.capability = capability;
  }

  public toJSON(): Readonly<{ capability: string; code: CapabilityValidationCode }> {
    return { capability: this.capability.toString(), code: this.code };
  }
}

function ensureUnique(
  capabilities: readonly RuntimeCapability[],
  code: "duplicate-binding" | "duplicate-requirement",
): void {
  const seen = new Set<string>();
  for (const capability of capabilities) {
    const key = capability.toString();
    if (seen.has(key)) {
      throw new CapabilityValidationError(code, capability);
    }
    seen.add(key);
  }
}

function validateRuntime(version: NodeRuntimeVersion): void {
  if (
    version.runtime !== "node" ||
    !Number.isSafeInteger(version.major) ||
    !Number.isSafeInteger(version.minor) ||
    !Number.isSafeInteger(version.patch) ||
    version.major < 1 ||
    version.minor < 0 ||
    version.patch < 0
  ) {
    throw new TypeError("Node runtime version is invalid.");
  }
}

function stateMeets(
  declaration: Readonly<AdapterCapabilityInput>,
  requirement: CapabilityRequirement,
): boolean {
  return (
    requirement.state === "any" ||
    (declaration.state.kind === "stateful" &&
      declaration.state.coordination === "shared" &&
      declaration.state.durability === "durable")
  );
}

function validateBinding(
  input: CapabilityCompositionInput,
  requirement: CapabilityRequirement,
  binding: CapabilityBinding,
): void {
  const declaration = binding.manifest.declarationFor(requirement.capability);
  if (declaration === undefined) {
    throw new CapabilityValidationError("undeclared-capability", requirement.capability);
  }
  if (!binding.manifest.profiles.includes(input.profile)) {
    throw new CapabilityValidationError("profile-incompatible", requirement.capability);
  }
  const node = binding.manifest.node;
  if (
    input.runtime.major < node.minimumMajor ||
    input.runtime.major >= node.maximumMajorExclusive
  ) {
    throw new CapabilityValidationError("runtime-incompatible", requirement.capability);
  }
  if (!stateMeets(declaration, requirement)) {
    throw new CapabilityValidationError("state-incompatible", requirement.capability);
  }
  if (
    requirement.residency === "verified-european" &&
    declaration.residency !== "verified-european"
  ) {
    throw new CapabilityValidationError("residency-incompatible", requirement.capability);
  }
}

export class ValidatedCapabilityComposition {
  readonly #bindings: ReadonlyMap<string, RuntimeCapabilityManifest>;

  private constructor(bindings: readonly CapabilityBinding[]) {
    this.#bindings = new Map(
      bindings.map((binding) => [binding.capability.toString(), binding.manifest]),
    );
    Object.freeze(this);
  }

  public manifestFor(capability: RuntimeCapability): RuntimeCapabilityManifest | undefined {
    return this.#bindings.get(capability.toString());
  }

  public static validate(input: CapabilityCompositionInput): ValidatedCapabilityComposition {
    validateRuntime(input.runtime);
    ensureUnique(
      input.requirements.map((entry) => entry.capability),
      "duplicate-requirement",
    );
    ensureUnique(
      input.bindings.map((entry) => entry.capability),
      "duplicate-binding",
    );
    const requirements = new Map(
      input.requirements.map((entry) => [entry.capability.toString(), entry]),
    );
    const bindings = new Map(input.bindings.map((entry) => [entry.capability.toString(), entry]));
    for (const binding of input.bindings) {
      if (!requirements.has(binding.capability.toString())) {
        throw new CapabilityValidationError("unexpected-binding", binding.capability);
      }
    }
    for (const requirement of input.requirements) {
      const binding = bindings.get(requirement.capability.toString());
      if (binding === undefined) {
        throw new CapabilityValidationError("missing-capability", requirement.capability);
      }
      validateBinding(input, requirement, binding);
    }
    return new ValidatedCapabilityComposition(input.bindings);
  }

  public toJSON(): Readonly<{ redacted: true }> {
    return { redacted: true };
  }
}

export function validateCapabilityComposition(
  input: CapabilityCompositionInput,
): ValidatedCapabilityComposition {
  return ValidatedCapabilityComposition.validate(input);
}
