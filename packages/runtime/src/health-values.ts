import { SchemaVersion } from "./capability-values.js";

export type DependencyHealthStatus = "degraded" | "healthy" | "unavailable";
export type HealthDiagnosticCode =
  | "check-failed"
  | "dependency-degraded"
  | "dependency-unavailable"
  | "invalid-response"
  | "none";
export type SchemaHealthStatus = "compatible" | "incompatible" | "not-applicable" | "unknown";

export class HealthCheckId {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): HealthCheckId {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > 100 ||
      !/^[a-z][a-z0-9]*(?:[./_-][a-z0-9]+)+$/u.test(value)
    ) {
      throw new TypeError("Health check ID must use the bounded namespaced format.");
    }
    return new HealthCheckId(value);
  }

  public equals(other: HealthCheckId): boolean {
    return this.#value === other.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class SchemaHealth {
  public readonly current: SchemaVersion | undefined;
  public readonly required: SchemaVersion | undefined;
  public readonly status: SchemaHealthStatus;

  private constructor(
    status: SchemaHealthStatus,
    current?: SchemaVersion,
    required?: SchemaVersion,
  ) {
    this.status = status;
    this.current = current;
    this.required = required;
    Object.freeze(this);
  }

  public static compatible(current: unknown, required: unknown): SchemaHealth {
    return SchemaHealth.compared("compatible", current, required);
  }

  public static incompatible(current: unknown, required: unknown): SchemaHealth {
    return SchemaHealth.compared("incompatible", current, required);
  }

  public static notApplicable(): SchemaHealth {
    return new SchemaHealth("not-applicable");
  }

  public static unknown(required: unknown): SchemaHealth {
    if (!(required instanceof SchemaVersion)) {
      throw new TypeError("Unknown schema health requires a validated required version.");
    }
    return new SchemaHealth("unknown", undefined, required);
  }

  private static compared(
    status: "compatible" | "incompatible",
    current: unknown,
    required: unknown,
  ): SchemaHealth {
    if (!(current instanceof SchemaVersion) || !(required instanceof SchemaVersion)) {
      throw new TypeError("Schema health requires validated current and required versions.");
    }
    return new SchemaHealth(status, current, required);
  }
}

export class DependencyHealthObservation {
  public readonly code: HealthDiagnosticCode;
  public readonly schema: SchemaHealth;
  public readonly status: DependencyHealthStatus;

  private constructor(
    status: DependencyHealthStatus,
    code: HealthDiagnosticCode,
    schema: SchemaHealth,
  ) {
    this.status = status;
    this.code = code;
    this.schema = schema;
    Object.freeze(this);
  }

  public static degraded(schema: unknown): DependencyHealthObservation {
    return DependencyHealthObservation.create("degraded", "dependency-degraded", schema);
  }

  public static healthy(schema: unknown): DependencyHealthObservation {
    return DependencyHealthObservation.create("healthy", "none", schema);
  }

  public static unavailable(schema: unknown): DependencyHealthObservation {
    return DependencyHealthObservation.create("unavailable", "dependency-unavailable", schema);
  }

  public static failed(code: "check-failed" | "invalid-response"): DependencyHealthObservation {
    return new DependencyHealthObservation("unavailable", code, SchemaHealth.notApplicable());
  }

  private static create(
    status: DependencyHealthStatus,
    code: HealthDiagnosticCode,
    schema: unknown,
  ): DependencyHealthObservation {
    if (!(schema instanceof SchemaHealth)) {
      throw new TypeError("Dependency health requires validated schema health.");
    }
    return new DependencyHealthObservation(status, code, schema);
  }
}
