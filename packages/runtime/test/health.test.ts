import { describe, expect, it } from "vitest";
import {
  DependencyHealthObservation,
  type DiagnosticsAccessController,
  EpochMilliseconds,
  HealthAccessError,
  HealthCheckId,
  RuntimeHealthService,
  SchemaHealth,
  SchemaVersion,
} from "../src/index.js";
import { ControlledClock } from "../src/testing.js";
import {
  diagnosticAccess,
  healthCheck,
  healthy,
  noSchema,
  SyntheticHealthCheck,
} from "./health-test-fixture.js";
import { normalRequest } from "./request-test-fixture.js";

describe("runtime health service", () => {
  it("reports liveness without invoking any dependency", () => {
    const dependency = healthCheck("database/control", healthy());
    const service = new RuntimeHealthService(
      new ControlledClock(123),
      [dependency],
      diagnosticAccess(),
    );

    expect(service.liveness()).toEqual({
      checkedAt: EpochMilliseconds.parse(123),
      status: "alive",
    });
    expect(dependency.calls).toBe(0);
    expect(Object.isFrozen(service.liveness())).toBe(true);
    expect(service.toJSON()).toEqual({ redacted: true });
  });

  it("checks only required dependencies and tolerates degradation", async () => {
    const required = healthCheck("queue/jobs", DependencyHealthObservation.degraded(noSchema()));
    const optional = healthCheck(
      "telemetry/export",
      DependencyHealthObservation.unavailable(noSchema()),
      false,
    );
    const service = new RuntimeHealthService(
      new ControlledClock(200),
      [required, optional],
      diagnosticAccess(),
    );

    await expect(service.readiness()).resolves.toEqual({
      checkedAt: EpochMilliseconds.parse(200),
      degradedChecks: 1,
      requiredChecks: 1,
      status: "ready",
    });
    expect(required.calls).toBe(1);
    expect(optional.calls).toBe(0);
  });

  it("fails readiness for unavailable dependencies and rejected probes", async () => {
    const unavailable = healthCheck(
      "database/control",
      DependencyHealthObservation.unavailable(noSchema()),
    );
    const rejected = new SyntheticHealthCheck(
      HealthCheckId.parse("queue/jobs"),
      true,
      false,
      healthy(),
      true,
    );
    const service = new RuntimeHealthService(
      new ControlledClock(300),
      [unavailable, rejected],
      diagnosticAccess(),
    );

    await expect(service.readiness()).resolves.toMatchObject({
      requiredChecks: 2,
      status: "not-ready",
    });
  });

  it.each([
    SchemaHealth.incompatible(SchemaVersion.parse(1), SchemaVersion.parse(2)),
    SchemaHealth.unknown(SchemaVersion.parse(2)),
    SchemaHealth.notApplicable(),
  ])("fails readiness when a required schema is not compatible", async (schema) => {
    const dependency = healthCheck(
      "database/customer",
      DependencyHealthObservation.healthy(schema),
      true,
      true,
    );
    const service = new RuntimeHealthService(
      new ControlledClock(),
      [dependency],
      diagnosticAccess(),
    );

    await expect(service.readiness()).resolves.toMatchObject({ status: "not-ready" });
  });

  it("accepts compatible schemas and ignores schema state where it is not required", async () => {
    const compatible = healthCheck(
      "database/control",
      DependencyHealthObservation.healthy(
        SchemaHealth.compatible(SchemaVersion.parse(3), SchemaVersion.parse(2)),
      ),
      true,
      true,
    );
    const schemaFree = healthCheck(
      "object-storage/exports",
      DependencyHealthObservation.healthy(noSchema()),
    );
    const service = new RuntimeHealthService(
      new ControlledClock(),
      [compatible, schemaFree],
      diagnosticAccess(),
    );

    await expect(service.readiness()).resolves.toMatchObject({ status: "ready" });
  });

  it("authorizes diagnostics before probing and denies failed authorization", async () => {
    const dependency = healthCheck("database/control", healthy());
    const denied = new RuntimeHealthService(
      new ControlledClock(),
      [dependency],
      diagnosticAccess(false),
    );
    const brokenAccess: DiagnosticsAccessController = {
      canReadDiagnostics: async () => Promise.reject(new Error("sensitive policy failure")),
    };
    const broken = new RuntimeHealthService(new ControlledClock(), [dependency], brokenAccess);

    await expect(denied.diagnostics(normalRequest())).rejects.toEqual(
      expect.objectContaining({ code: "diagnostics-denied" }),
    );
    await expect(broken.diagnostics(normalRequest())).rejects.toBeInstanceOf(HealthAccessError);
    await expect(Reflect.apply(denied.diagnostics, denied, [{}])).rejects.toBeInstanceOf(
      HealthAccessError,
    );
    expect(dependency.calls).toBe(0);
  });

  it("returns bounded detailed diagnostics only after authorization", async () => {
    const compatible = healthCheck(
      "database/control",
      DependencyHealthObservation.healthy(
        SchemaHealth.compatible(SchemaVersion.parse(3), SchemaVersion.parse(2)),
      ),
      true,
      true,
    );
    const optional = healthCheck(
      "telemetry/export",
      DependencyHealthObservation.unavailable(noSchema()),
      false,
    );
    const service = new RuntimeHealthService(
      new ControlledClock(400),
      [compatible, optional],
      diagnosticAccess(),
    );
    const report = await service.diagnostics(normalRequest());

    expect(report).toEqual({
      checkedAt: EpochMilliseconds.parse(400),
      checks: [
        {
          code: "none",
          currentSchemaVersion: 3,
          id: "database/control",
          requiredForReadiness: true,
          requiredSchemaVersion: 2,
          schemaStatus: "compatible",
          status: "healthy",
        },
        {
          code: "dependency-unavailable",
          id: "telemetry/export",
          requiredForReadiness: false,
          schemaStatus: "not-applicable",
          status: "unavailable",
        },
      ],
      status: "ready",
    });
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.checks)).toBe(true);
    expect(Object.isFrozen(report.checks[0])).toBe(true);
  });

  it("normalizes malformed and rejected diagnostic probes without leaking errors", async () => {
    const malformed = healthCheck("cache/state", healthy());
    Object.defineProperty(malformed, "check", {
      value: async () => ({ status: "healthy", secret: "do-not-leak" }),
    });
    const rejected = new SyntheticHealthCheck(
      HealthCheckId.parse("queue/jobs"),
      false,
      false,
      healthy(),
      true,
    );
    const service = new RuntimeHealthService(
      new ControlledClock(),
      [malformed, rejected],
      diagnosticAccess(),
    );
    const report = await service.diagnostics(normalRequest());

    expect(report.checks).toEqual([
      expect.objectContaining({ code: "invalid-response", status: "unavailable" }),
      expect.objectContaining({ code: "check-failed", status: "unavailable" }),
    ]);
    expect(JSON.stringify(report)).not.toContain("secret");
    expect(report.status).toBe("not-ready");
  });
});
