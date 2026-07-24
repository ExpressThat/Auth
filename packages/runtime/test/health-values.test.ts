import { describe, expect, it } from "vitest";
import {
  DependencyHealthObservation,
  HealthCheckId,
  SchemaHealth,
  SchemaVersion,
} from "../src/index.js";

describe("health values", () => {
  it("validates namespaced health check identifiers", () => {
    const first = HealthCheckId.parse("database/control-plane");
    const same = HealthCheckId.parse("database/control-plane");
    const other = HealthCheckId.parse("queue.jobs_primary");

    expect(first.toString()).toBe("database/control-plane");
    expect(first.equals(same)).toBe(true);
    expect(first.equals(other)).toBe(false);
  });

  it.each([null, "x", `a/${"b".repeat(100)}`, "Database/control", "database", "database//control"])(
    "rejects invalid health check identifier %j",
    (value) => {
      expect(() => HealthCheckId.parse(value)).toThrow(TypeError);
    },
  );

  it("represents every schema-health state with validated versions", () => {
    const current = SchemaVersion.parse(2);
    const required = SchemaVersion.parse(1);

    expect(SchemaHealth.compatible(current, required)).toMatchObject({
      current,
      required,
      status: "compatible",
    });
    expect(SchemaHealth.incompatible(current, required)).toMatchObject({
      current,
      required,
      status: "incompatible",
    });
    expect(SchemaHealth.unknown(required)).toMatchObject({
      current: undefined,
      required,
      status: "unknown",
    });
    expect(SchemaHealth.notApplicable()).toEqual({
      current: undefined,
      required: undefined,
      status: "not-applicable",
    });
    expect(Object.isFrozen(SchemaHealth.notApplicable())).toBe(true);
  });

  it("rejects unvalidated schema versions", () => {
    const version = SchemaVersion.parse(1);

    expect(() => SchemaHealth.compatible(1, version)).toThrow(TypeError);
    expect(() => SchemaHealth.incompatible(version, 1)).toThrow(TypeError);
    expect(() => SchemaHealth.unknown(1)).toThrow(TypeError);
  });

  it("creates frozen, internally consistent dependency observations", () => {
    const schema = SchemaHealth.notApplicable();
    const healthy = DependencyHealthObservation.healthy(schema);
    const degraded = DependencyHealthObservation.degraded(schema);
    const unavailable = DependencyHealthObservation.unavailable(schema);

    expect(healthy).toMatchObject({ code: "none", schema, status: "healthy" });
    expect(degraded).toMatchObject({
      code: "dependency-degraded",
      schema,
      status: "degraded",
    });
    expect(unavailable).toMatchObject({
      code: "dependency-unavailable",
      schema,
      status: "unavailable",
    });
    expect(DependencyHealthObservation.failed("check-failed")).toMatchObject({
      code: "check-failed",
      status: "unavailable",
    });
    expect(DependencyHealthObservation.failed("invalid-response")).toMatchObject({
      code: "invalid-response",
      status: "unavailable",
    });
    expect(Object.isFrozen(healthy)).toBe(true);
  });

  it("rejects dependency observations with an unvalidated schema state", () => {
    expect(() => DependencyHealthObservation.healthy({ status: "compatible" })).toThrow(TypeError);
    expect(() => DependencyHealthObservation.degraded(null)).toThrow(TypeError);
    expect(() => DependencyHealthObservation.unavailable("not-applicable")).toThrow(TypeError);
  });
});
