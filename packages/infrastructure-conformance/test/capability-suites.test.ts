import { describe, expect, it } from "vitest";
import {
  type ConformanceProbe,
  type CustodyConformanceProbes,
  defineCacheConformanceSuite,
  defineKeyManagementConformanceSuite,
  defineObjectStorageConformanceSuite,
  defineObservabilityConformanceSuite,
  defineQueueConformanceSuite,
  defineSecretConformanceSuite,
  type StatefulConformanceProbes,
} from "../src/index.js";

function probe(name: string): ConformanceProbe {
  return { name, run: async () => {} };
}

function stateful(): StatefulConformanceProbes {
  return {
    concurrency: probe("concurrency evidence"),
    failure: probe("failure evidence"),
    health: probe("health evidence"),
    redaction: probe("redaction evidence"),
    residency: probe("residency evidence"),
    retry: probe("retry evidence"),
    runtime: probe("runtime evidence"),
    success: probe("success evidence"),
    timeout: probe("timeout evidence"),
  };
}

function custody(): CustodyConformanceProbes {
  const { health: _health, ...selected } = stateful();
  return selected;
}

describe("capability conformance suite definitions", () => {
  it.each([
    ["cache", () => defineCacheConformanceSuite(stateful(), 1_000)],
    ["key-management", () => defineKeyManagementConformanceSuite(custody(), 1_000)],
    ["object-storage", () => defineObjectStorageConformanceSuite(stateful(), 1_000)],
    ["observability", () => defineObservabilityConformanceSuite(stateful(), 1_000)],
    ["queue", () => defineQueueConformanceSuite(stateful(), 1_000)],
    ["secret", () => defineSecretConformanceSuite(custody(), 1_000)],
  ] as const)("builds and executes the complete %s suite", async (capability, define) => {
    const report = await define().run();

    expect(report.capability).toBe(capability);
    expect(report.results.length).toBe(
      capability === "secret" || capability === "key-management" ? 8 : 9,
    );
  });

  it("rejects a hostile runtime probe key", () => {
    const probes = stateful();
    Object.defineProperty(probes, "unknown", {
      enumerable: true,
      value: probe("unknown evidence"),
    });

    expect(() => defineCacheConformanceSuite(probes, 1_000)).toThrow("probe axis is invalid");
  });
});
