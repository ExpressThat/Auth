import type { CapabilityRequirement } from "./capability-validation.js";
import {
  type ValidatedCapabilityComposition,
  validateCapabilityComposition,
} from "./capability-validation.js";
import { OperatorAdapterRegistration } from "./operator-package.js";
import { OperatorAdapterSelection } from "./operator-selection.js";

export type OperatorAdapterRegistryCode =
  | "duplicate-adapter"
  | "empty-registry"
  | "invalid-registration"
  | "invalid-selection"
  | "platform-incompatible"
  | "unknown-adapter";

export class OperatorAdapterRegistryError extends Error {
  public readonly code: OperatorAdapterRegistryCode;

  public constructor(code: OperatorAdapterRegistryCode) {
    super(`Operator adapter registry failed (${code}).`);
    this.name = "OperatorAdapterRegistryError";
    this.code = code;
  }

  public toJSON(): Readonly<{ code: OperatorAdapterRegistryCode }> {
    return { code: this.code };
  }
}

export class OperatorAdapterRegistry {
  readonly #registrations: ReadonlyMap<string, OperatorAdapterRegistration>;

  private constructor(registrations: readonly OperatorAdapterRegistration[]) {
    this.#registrations = new Map(
      registrations.map((registration) => [registration.manifest.adapter.toString(), registration]),
    );
    Object.freeze(this);
  }

  public static create(
    registrations: readonly OperatorAdapterRegistration[],
  ): OperatorAdapterRegistry {
    if (registrations.length === 0) {
      throw new OperatorAdapterRegistryError("empty-registry");
    }
    const identifiers = new Set<string>();
    for (const registration of registrations) {
      if (!(registration instanceof OperatorAdapterRegistration)) {
        throw new OperatorAdapterRegistryError("invalid-registration");
      }
      const identifier = registration.manifest.adapter.toString();
      if (identifiers.has(identifier)) {
        throw new OperatorAdapterRegistryError("duplicate-adapter");
      }
      identifiers.add(identifier);
    }
    return new OperatorAdapterRegistry(registrations);
  }

  public resolve(
    selection: OperatorAdapterSelection,
    requirements: readonly CapabilityRequirement[],
  ): ValidatedCapabilityComposition {
    if (!(selection instanceof OperatorAdapterSelection)) {
      throw new OperatorAdapterRegistryError("invalid-selection");
    }
    const bindings = selection.bindings().map((binding) => {
      const registration = this.#registrations.get(binding.adapter.toString());
      if (registration === undefined) {
        throw new OperatorAdapterRegistryError("unknown-adapter");
      }
      if (!registration.supports(selection.platform)) {
        throw new OperatorAdapterRegistryError("platform-incompatible");
      }
      return { capability: binding.capability, manifest: registration.manifest };
    });

    return validateCapabilityComposition({
      bindings,
      profile: selection.profile,
      requirements,
      runtime: selection.runtime,
    });
  }

  public toJSON(): Readonly<{ adapters: number; redacted: true }> {
    return { adapters: this.#registrations.size, redacted: true };
  }
}
