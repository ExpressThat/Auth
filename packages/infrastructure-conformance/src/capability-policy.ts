import type { ConformanceAxis, InfrastructureCapabilityKind } from "./conformance-model.js";

const STATEFUL_AXES: readonly ConformanceAxis[] = [
  "concurrency",
  "failure",
  "health",
  "redaction",
  "residency",
  "retry",
  "runtime",
  "success",
  "timeout",
];
const CUSTODY_AXES: readonly ConformanceAxis[] = STATEFUL_AXES.filter((axis) => axis !== "health");

const CAPABILITY_AXES: Readonly<Record<InfrastructureCapabilityKind, readonly ConformanceAxis[]>> =
  {
    cache: STATEFUL_AXES,
    "key-management": CUSTODY_AXES,
    "object-storage": STATEFUL_AXES,
    observability: STATEFUL_AXES,
    queue: STATEFUL_AXES,
    secret: CUSTODY_AXES,
  };

export function requiredConformanceAxes(
  capability: InfrastructureCapabilityKind,
): readonly ConformanceAxis[] {
  return CAPABILITY_AXES[capability];
}
