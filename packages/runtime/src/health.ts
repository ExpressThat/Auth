import { DependencyHealthObservation, HealthCheckId } from "./health-values.js";
import { RequestContext } from "./request-context.js";
import type { Clock, EpochMilliseconds } from "./time.js";

export type ReadinessStatus = "not-ready" | "ready";
export type HealthAccessErrorCode = "diagnostics-denied";

export interface RuntimeHealthCheck {
  readonly id: HealthCheckId;
  readonly requiredForReadiness: boolean;
  readonly requiresCompatibleSchema: boolean;
  check(): Promise<DependencyHealthObservation>;
}

export interface DiagnosticsAccessController {
  canReadDiagnostics(context: RequestContext): Promise<boolean>;
}

export interface LivenessReport {
  readonly checkedAt: EpochMilliseconds;
  readonly status: "alive";
}

export interface ReadinessReport {
  readonly checkedAt: EpochMilliseconds;
  readonly degradedChecks: number;
  readonly requiredChecks: number;
  readonly status: ReadinessStatus;
}

export interface DependencyDiagnostic {
  readonly code: DependencyHealthObservation["code"];
  readonly currentSchemaVersion?: number;
  readonly id: string;
  readonly requiredForReadiness: boolean;
  readonly requiredSchemaVersion?: number;
  readonly schemaStatus: DependencyHealthObservation["schema"]["status"];
  readonly status: DependencyHealthObservation["status"];
}

export interface DiagnosticsReport {
  readonly checkedAt: EpochMilliseconds;
  readonly checks: readonly Readonly<DependencyDiagnostic>[];
  readonly status: ReadinessStatus;
}

export class HealthAccessError extends Error {
  public readonly code: HealthAccessErrorCode = "diagnostics-denied";

  public constructor() {
    super("Runtime diagnostics access denied.");
    this.name = "HealthAccessError";
  }

  public toJSON(): Readonly<{ code: HealthAccessErrorCode }> {
    return { code: this.code };
  }
}

interface CheckedDependency {
  readonly check: RuntimeHealthCheck;
  readonly observation: DependencyHealthObservation;
}

export class RuntimeHealthService {
  readonly #access: DiagnosticsAccessController;
  readonly #checks: readonly RuntimeHealthCheck[];
  readonly #clock: Clock;

  public constructor(
    clock: Clock,
    checks: readonly RuntimeHealthCheck[],
    access: DiagnosticsAccessController,
  ) {
    requireDependency(clock, "now");
    requireDependency(access, "canReadDiagnostics");
    this.#checks = validateChecks(checks);
    this.#clock = clock;
    this.#access = access;
  }

  public diagnostics(context: RequestContext): Promise<DiagnosticsReport> {
    return this.authorizedDiagnostics(context);
  }

  public liveness(): LivenessReport {
    return Object.freeze({ checkedAt: this.#clock.now(), status: "alive" });
  }

  public async readiness(): Promise<ReadinessReport> {
    const checked = await checkDependencies(
      this.#checks.filter((check) => check.requiredForReadiness),
    );
    return readinessReport(this.#clock.now(), checked);
  }

  public toJSON(): Readonly<{ redacted: true }> {
    return { redacted: true };
  }

  private async authorizedDiagnostics(context: RequestContext): Promise<DiagnosticsReport> {
    if (!(context instanceof RequestContext) || !(await isAuthorized(this.#access, context))) {
      throw new HealthAccessError();
    }
    const checked = await checkDependencies(this.#checks);
    const report = readinessReport(
      this.#clock.now(),
      checked.filter((entry) => entry.check.requiredForReadiness),
    );
    return Object.freeze({
      checkedAt: report.checkedAt,
      checks: Object.freeze(checked.map(toDiagnostic)),
      status: report.status,
    });
  }
}

async function isAuthorized(
  access: DiagnosticsAccessController,
  context: RequestContext,
): Promise<boolean> {
  try {
    return (await access.canReadDiagnostics(context)) === true;
  } catch {
    return false;
  }
}

function validateChecks(checks: readonly RuntimeHealthCheck[]): readonly RuntimeHealthCheck[] {
  const validated = checks.map((check) => {
    if (
      check === null ||
      typeof check !== "object" ||
      !(check.id instanceof HealthCheckId) ||
      typeof check.requiredForReadiness !== "boolean" ||
      typeof check.requiresCompatibleSchema !== "boolean" ||
      typeof check.check !== "function"
    ) {
      throw new TypeError("Runtime health checks must implement the validated contract.");
    }
    return check;
  });
  const identifiers = validated.map((check) => check.id.toString());
  if (new Set(identifiers).size !== identifiers.length) {
    throw new TypeError("Runtime health check IDs must be unique.");
  }
  return Object.freeze(validated);
}

function requireDependency(value: unknown, method: string): void {
  if (
    value === null ||
    (typeof value !== "object" && typeof value !== "function") ||
    typeof Reflect.get(value, method) !== "function"
  ) {
    throw new TypeError("Runtime health service dependency is invalid.");
  }
}

async function checkDependencies(
  checks: readonly RuntimeHealthCheck[],
): Promise<readonly CheckedDependency[]> {
  return Promise.all(
    checks.map(async (check) => {
      try {
        const observation = await check.check();
        return {
          check,
          observation:
            observation instanceof DependencyHealthObservation
              ? observation
              : DependencyHealthObservation.failed("invalid-response"),
        };
      } catch {
        return { check, observation: DependencyHealthObservation.failed("check-failed") };
      }
    }),
  );
}

function blocksReadiness(entry: CheckedDependency): boolean {
  return (
    entry.observation.status === "unavailable" ||
    (entry.check.requiresCompatibleSchema && entry.observation.schema.status !== "compatible")
  );
}

function readinessReport(
  checkedAt: EpochMilliseconds,
  checked: readonly CheckedDependency[],
): Readonly<ReadinessReport> {
  return Object.freeze({
    checkedAt,
    degradedChecks: checked.filter((entry) => entry.observation.status === "degraded").length,
    requiredChecks: checked.length,
    status: checked.some(blocksReadiness) ? "not-ready" : "ready",
  });
}

function toDiagnostic(entry: CheckedDependency): Readonly<DependencyDiagnostic> {
  const schema = entry.observation.schema;
  const current = schema.current;
  const required = schema.required;
  return Object.freeze({
    code: entry.observation.code,
    ...(current === undefined ? {} : { currentSchemaVersion: Number(current) }),
    id: entry.check.id.toString(),
    requiredForReadiness: entry.check.requiredForReadiness,
    ...(required === undefined ? {} : { requiredSchemaVersion: Number(required) }),
    schemaStatus: schema.status,
    status: entry.observation.status,
  });
}
