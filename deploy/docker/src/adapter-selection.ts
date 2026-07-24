import { parseOperatorAdapterConfiguration } from "@expressthat-auth/config/operator";
import type {
  CapabilityRequirement,
  ValidatedCapabilityComposition,
} from "@expressthat-auth/runtime";
import {
  type OperatorAdapterRegistration,
  OperatorAdapterRegistry,
} from "@expressthat-auth/runtime/operator";

export function resolveDockerAdapterConfiguration(
  input: unknown,
  registrations: readonly OperatorAdapterRegistration[],
  requirements: readonly CapabilityRequirement[],
): ValidatedCapabilityComposition {
  const selection = parseOperatorAdapterConfiguration(input);
  return OperatorAdapterRegistry.create(registrations).resolve(selection, requirements);
}
