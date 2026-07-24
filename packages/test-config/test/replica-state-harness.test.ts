import { describe, expect, it } from "vitest";
import {
  REPLICA_STATE_CATEGORIES,
  ReplicaStateConformanceError,
  ReplicaStateConformanceSuite,
  ReplicaStateDefinitionError,
  type ReplicaStateProbes,
} from "../src/replica-state-harness.js";
import { replicaStateProbes } from "./replica-state-fixture.js";

function defineUnknown(probes: unknown, timeout = 100): ReplicaStateConformanceSuite {
  return Reflect.apply(ReplicaStateConformanceSuite.define, ReplicaStateConformanceSuite, [
    probes,
    timeout,
  ]);
}

function withLockProbe(probe: ReplicaStateProbes["locks"]): ReplicaStateProbes {
  return { ...replicaStateProbes(true), locks: probe };
}

describe("cross-replica state conformance", () => {
  it("accepts every required invariant through a shared backend", async () => {
    const suite = ReplicaStateConformanceSuite.define(replicaStateProbes(true), 100);
    const report = await suite.run();

    expect(report).toEqual({
      passed: REPLICA_STATE_CATEGORIES,
    });
    expect(Object.isFrozen(REPLICA_STATE_CATEGORIES)).toBe(true);
    expect(Object.isFrozen(report.passed)).toBe(true);
  });

  it("rejects every invariant when replicas keep independent process state", async () => {
    const suite = ReplicaStateConformanceSuite.define(replicaStateProbes(false), 100);

    await expect(suite.run()).rejects.toEqual(
      expect.objectContaining({
        categories: REPLICA_STATE_CATEGORIES,
        code: "probe-failed",
      }),
    );
  });

  it("normalizes thrown probes and bounded timeouts", async () => {
    const throwing = ReplicaStateConformanceSuite.define(
      withLockProbe({
        name: "throws diagnostics",
        run: async () => {
          throw new Error("sensitive provider detail");
        },
      }),
      100,
    );
    await expect(throwing.run()).rejects.toMatchObject({
      categories: ["locks"],
      code: "probe-failed",
    });

    const timedOut = ReplicaStateConformanceSuite.define(
      withLockProbe({
        name: "waits forever",
        run: async ({ signal }) =>
          new Promise<boolean>((resolve) => {
            signal.addEventListener("abort", () => resolve(false), { once: true });
          }),
      }),
      1,
    );
    await expect(timedOut.run()).rejects.toMatchObject({
      categories: ["locks"],
      code: "probe-timeout",
    });
  });

  it.each([0, 60_001, 1.5])("rejects invalid timeout %s", (timeout) => {
    expect(() => ReplicaStateConformanceSuite.define(replicaStateProbes(true), timeout)).toThrow(
      expect.objectContaining({ code: "invalid-timeout" }),
    );
  });

  it("rejects missing and unexpected probes", () => {
    const missing = { ...replicaStateProbes(true) };
    Reflect.deleteProperty(missing, "sessions");
    expect(() => defineUnknown(missing)).toThrow(
      expect.objectContaining({ code: "missing-probe" }),
    );

    const unexpected = {
      ...replicaStateProbes(true),
      unknown: { name: "unknown", run: async () => true },
    };
    expect(() => defineUnknown(unexpected)).toThrow(
      expect.objectContaining({ code: "unexpected-probe" }),
    );
  });

  it.each([
    [null, "null"],
    [1, "primitive"],
    [{ name: "", run: async () => true }, "empty name"],
    [{ name: "INVALID", run: async () => true }, "invalid name"],
    [{ name: "a".repeat(121), run: async () => true }, "long name"],
    [{ name: "missing run" }, "missing run"],
  ])("rejects an invalid %s probe", (probe, _label) => {
    const probes = { ...replicaStateProbes(true), locks: probe };

    expect(() => defineUnknown(probes)).toThrow(expect.objectContaining({ code: "invalid-probe" }));
  });

  it("redacts definition and conformance error serialization", () => {
    const definition = new ReplicaStateDefinitionError("invalid-probe");
    const conformance = new ReplicaStateConformanceError("probe-failed", ["sessions"]);

    expect(definition.name).toBe("ReplicaStateDefinitionError");
    expect(definition.toJSON()).toEqual({ code: "invalid-probe" });
    expect(conformance.name).toBe("ReplicaStateConformanceError");
    expect(conformance.toJSON()).toEqual({
      categories: ["sessions"],
      code: "probe-failed",
    });
    expect(Object.isFrozen(conformance.categories)).toBe(true);
    expect(JSON.stringify([definition, conformance])).not.toContain("provider detail");
  });
});
