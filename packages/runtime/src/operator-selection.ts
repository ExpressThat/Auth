import type { DeploymentProfile } from "./capability-manifest.js";
import type { NodeRuntimeVersion } from "./capability-validation.js";
import { AdapterIdentifier, RuntimeCapability } from "./capability-values.js";
import type { OperatorRuntimePlatformInput } from "./operator-package.js";

export type OperatorDeploymentProfile = Exclude<DeploymentProfile, "test">;

export interface OperatorAdapterBindingInput {
  readonly adapter: AdapterIdentifier;
  readonly capability: RuntimeCapability;
}

export interface OperatorAdapterSelectionInput {
  readonly bindings: readonly OperatorAdapterBindingInput[];
  readonly platform: OperatorRuntimePlatformInput;
  readonly profile: OperatorDeploymentProfile;
  readonly runtime: NodeRuntimeVersion;
}

export type OperatorAdapterSelectionCode =
  | "duplicate-capability"
  | "duplicate-external-capability"
  | "empty-selection"
  | "invalid-binding"
  | "invalid-platform"
  | "invalid-profile"
  | "invalid-runtime";

export class OperatorAdapterSelectionError extends Error {
  public readonly code: OperatorAdapterSelectionCode;

  public constructor(code: OperatorAdapterSelectionCode) {
    super(`Operator adapter selection is invalid (${code}).`);
    this.name = "OperatorAdapterSelectionError";
    this.code = code;
  }

  public toJSON(): Readonly<{ code: OperatorAdapterSelectionCode }> {
    return { code: this.code };
  }
}

export class OperatorAdapterSelection {
  readonly #bindings: readonly Readonly<OperatorAdapterBindingInput>[];
  public readonly platform: Readonly<OperatorRuntimePlatformInput>;
  public readonly profile: OperatorDeploymentProfile;
  public readonly runtime: Readonly<NodeRuntimeVersion>;

  private constructor(input: OperatorAdapterSelectionInput) {
    this.#bindings = Object.freeze(input.bindings.map((binding) => Object.freeze({ ...binding })));
    this.platform = Object.freeze({
      ...input.platform,
      externalCapabilities: Object.freeze([...input.platform.externalCapabilities]),
    });
    this.profile = input.profile;
    this.runtime = Object.freeze({ ...input.runtime });
    Object.freeze(this);
  }

  public static create(input: OperatorAdapterSelectionInput): OperatorAdapterSelection {
    validateProfile(input.profile);
    validateRuntime(input.runtime);
    validatePlatform(input.platform);
    if (input.bindings.length === 0) {
      throw new OperatorAdapterSelectionError("empty-selection");
    }

    const capabilities = new Set<string>();
    for (const binding of input.bindings) {
      if (
        !(binding.adapter instanceof AdapterIdentifier) ||
        !(binding.capability instanceof RuntimeCapability)
      ) {
        throw new OperatorAdapterSelectionError("invalid-binding");
      }
      const capability = binding.capability.toString();
      if (capabilities.has(capability)) {
        throw new OperatorAdapterSelectionError("duplicate-capability");
      }
      capabilities.add(capability);
    }
    return new OperatorAdapterSelection(input);
  }

  public bindings(): readonly Readonly<OperatorAdapterBindingInput>[] {
    return this.#bindings;
  }

  public toJSON(): Readonly<{ bindings: number; redacted: true }> {
    return { bindings: this.#bindings.length, redacted: true };
  }
}

function validatePlatform(platform: OperatorRuntimePlatformInput): void {
  if (
    !["amd64", "arm64"].includes(platform.containerArchitecture) ||
    !["darwin", "linux", "win32"].includes(platform.operatingSystem) ||
    platform.externalCapabilities.some(
      (capability) =>
        capability.length > 96 ||
        !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)+$/u.test(
          capability,
        ),
    )
  ) {
    throw new OperatorAdapterSelectionError("invalid-platform");
  }
  if (new Set(platform.externalCapabilities).size !== platform.externalCapabilities.length) {
    throw new OperatorAdapterSelectionError("duplicate-external-capability");
  }
}

function validateProfile(profile: OperatorDeploymentProfile): void {
  if (!["hosted", "local-development", "self-hosted"].includes(profile)) {
    throw new OperatorAdapterSelectionError("invalid-profile");
  }
}

function validateRuntime(runtime: NodeRuntimeVersion): void {
  if (
    runtime.runtime !== "node" ||
    !Number.isSafeInteger(runtime.major) ||
    !Number.isSafeInteger(runtime.minor) ||
    !Number.isSafeInteger(runtime.patch) ||
    runtime.major < 1 ||
    runtime.minor < 0 ||
    runtime.patch < 0
  ) {
    throw new OperatorAdapterSelectionError("invalid-runtime");
  }
}
