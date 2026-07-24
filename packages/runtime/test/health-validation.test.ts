import { describe, expect, it } from "vitest";
import { HealthAccessError, RuntimeHealthService } from "../src/index.js";
import { ControlledClock } from "../src/testing.js";
import { diagnosticAccess, healthCheck, healthy } from "./health-test-fixture.js";

function constructHealthService(clock: unknown, checks: unknown, controller: unknown): unknown {
  return Reflect.construct(RuntimeHealthService, [clock, checks, controller]);
}

describe("runtime health service validation", () => {
  it("rejects malformed foundational dependencies", () => {
    expect(() => constructHealthService(null, [], diagnosticAccess())).toThrow(TypeError);
    expect(() => constructHealthService(1, [], diagnosticAccess())).toThrow(TypeError);
    expect(() => constructHealthService({}, [], diagnosticAccess())).toThrow(TypeError);
    expect(() => constructHealthService(new ControlledClock(), [], null)).toThrow(TypeError);
    expect(() => constructHealthService(new ControlledClock(), [], {})).toThrow(TypeError);
  });

  it("rejects malformed checks and duplicate identifiers", () => {
    const valid = healthCheck("database/control", healthy());

    expect(() => constructHealthService(new ControlledClock(), [null], diagnosticAccess())).toThrow(
      TypeError,
    );
    expect(() =>
      constructHealthService(
        new ControlledClock(),
        [{ ...valid, id: "database/control" }],
        diagnosticAccess(),
      ),
    ).toThrow(TypeError);
    expect(() =>
      constructHealthService(
        new ControlledClock(),
        [{ ...valid, requiredForReadiness: "yes" }],
        diagnosticAccess(),
      ),
    ).toThrow(TypeError);
    expect(() =>
      constructHealthService(
        new ControlledClock(),
        [{ ...valid, requiresCompatibleSchema: "yes" }],
        diagnosticAccess(),
      ),
    ).toThrow(TypeError);
    expect(() =>
      constructHealthService(
        new ControlledClock(),
        [{ ...valid, check: undefined }],
        diagnosticAccess(),
      ),
    ).toThrow(TypeError);
    expect(() =>
      constructHealthService(new ControlledClock(), [valid, valid], diagnosticAccess()),
    ).toThrow(TypeError);
  });

  it("uses a stable redacted diagnostics access error", () => {
    const error = new HealthAccessError();

    expect(error.name).toBe("HealthAccessError");
    expect(error.message).toBe("Runtime diagnostics access denied.");
    expect(error.toJSON()).toEqual({ code: "diagnostics-denied" });
  });
});
