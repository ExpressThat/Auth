import {
  DependencyHealthObservation,
  type DiagnosticsAccessController,
  HealthCheckId,
  type RuntimeHealthCheck,
  SchemaHealth,
} from "../src/index.js";

export class SyntheticHealthCheck implements RuntimeHealthCheck {
  public calls = 0;
  public readonly id: HealthCheckId;
  public readonly requiredForReadiness: boolean;
  public readonly requiresCompatibleSchema: boolean;
  readonly #rejects: boolean;
  readonly #result: DependencyHealthObservation;

  public constructor(
    id: HealthCheckId,
    requiredForReadiness: boolean,
    requiresCompatibleSchema: boolean,
    result: DependencyHealthObservation,
    rejects = false,
  ) {
    this.id = id;
    this.requiredForReadiness = requiredForReadiness;
    this.requiresCompatibleSchema = requiresCompatibleSchema;
    this.#result = result;
    this.#rejects = rejects;
  }

  public check(): Promise<DependencyHealthObservation> {
    this.calls += 1;
    return this.#rejects ? Promise.reject(new Error("sensitive provider failure")) : this.resolve();
  }

  private async resolve(): Promise<DependencyHealthObservation> {
    return this.#result;
  }
}

export function diagnosticAccess(result = true): DiagnosticsAccessController {
  return { canReadDiagnostics: async () => result };
}

export function healthCheck(
  id: string,
  result: DependencyHealthObservation,
  requiredForReadiness = true,
  requiresCompatibleSchema = false,
): SyntheticHealthCheck {
  return new SyntheticHealthCheck(
    HealthCheckId.parse(id),
    requiredForReadiness,
    requiresCompatibleSchema,
    result,
  );
}

export function noSchema(): SchemaHealth {
  return SchemaHealth.notApplicable();
}

export function healthy(): DependencyHealthObservation {
  return DependencyHealthObservation.healthy(noSchema());
}
