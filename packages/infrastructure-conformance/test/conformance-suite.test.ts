import { afterEach, describe, expect, it, vi } from "vitest";
import {
  type ConformanceCaseInput,
  ConformanceDefinitionError,
  ConformanceExecutionError,
  type InfrastructureCapabilityKind,
  InfrastructureConformanceSuite,
  requiredConformanceAxes,
} from "../src/index.js";

function passingCases(capability: InfrastructureCapabilityKind): ConformanceCaseInput[] {
  return requiredConformanceAxes(capability).map((axis) => ({
    axis,
    name: `${axis} evidence`,
    run: async () => {},
  }));
}

function suite(capability: InfrastructureCapabilityKind = "cache"): InfrastructureConformanceSuite {
  return InfrastructureConformanceSuite.define({
    capability,
    cases: passingCases(capability),
    timeoutMilliseconds: 1_000,
  });
}

function replace(object: object, property: string, value: unknown): void {
  Object.defineProperty(object, property, { configurable: true, value });
}

describe("infrastructure conformance suite definitions", () => {
  it.each([
    "cache",
    "key-management",
    "object-storage",
    "observability",
    "queue",
    "secret",
  ] as const)("defines, freezes, runs, and reports the %s policy", async (capability) => {
    const selected = suite(capability);
    const report = await selected.run();

    expect(report.capability).toBe(capability);
    expect(report.results.map((result) => result.axis)).toEqual(
      requiredConformanceAxes(capability),
    );
    expect(report.results.every((result) => result.status === "passed")).toBe(true);
    expect(Object.isFrozen(selected)).toBe(true);
    expect(Object.isFrozen(report)).toBe(true);
    expect(Object.isFrozen(report.results)).toBe(true);
    expect(JSON.stringify(selected)).toBe(
      JSON.stringify({
        capability,
        cases: requiredConformanceAxes(capability).length,
      }),
    );
  });

  it.each([0, 60_001, 1.5])("rejects invalid timeout %s", (timeoutMilliseconds) => {
    expect(() =>
      InfrastructureConformanceSuite.define({
        capability: "cache",
        cases: passingCases("cache"),
        timeoutMilliseconds,
      }),
    ).toThrowError(expect.objectContaining({ code: "invalid-timeout" }));
  });

  it("rejects missing, duplicate, unexpected, and malformed cases", () => {
    const missing = passingCases("cache").slice(1);
    expect(() =>
      InfrastructureConformanceSuite.define({
        capability: "cache",
        cases: missing,
        timeoutMilliseconds: 1,
      }),
    ).toThrowError(expect.objectContaining({ code: "missing-axis" }));

    const duplicate = passingCases("cache");
    replace(duplicate[1] ?? {}, "name", duplicate[0]?.name);
    expect(() =>
      InfrastructureConformanceSuite.define({
        capability: "cache",
        cases: duplicate,
        timeoutMilliseconds: 1,
      }),
    ).toThrowError(expect.objectContaining({ code: "duplicate-case" }));

    const unexpected = passingCases("secret");
    unexpected.push({ axis: "health", name: "health evidence", run: async () => {} });
    expect(() =>
      InfrastructureConformanceSuite.define({
        capability: "secret",
        cases: unexpected,
        timeoutMilliseconds: 1,
      }),
    ).toThrowError(expect.objectContaining({ code: "unexpected-axis" }));

    for (const [property, value] of [
      ["name", "UPPER"],
      ["name", `a${"x".repeat(121)}`],
      ["run", undefined],
    ] as const) {
      const malformed = passingCases("cache");
      replace(malformed[0] ?? {}, property, value);
      expect(() =>
        InfrastructureConformanceSuite.define({
          capability: "cache",
          cases: malformed,
          timeoutMilliseconds: 1,
        }),
      ).toThrowError(expect.objectContaining({ code: "invalid-case" }));
    }
  });

  it("normalizes case failures without retaining their diagnostic", async () => {
    const cases = passingCases("cache");
    replace(cases[0] ?? {}, "run", async () => {
      throw new Error("sensitive-provider-detail");
    });
    const selected = InfrastructureConformanceSuite.define({
      capability: "cache",
      cases,
      timeoutMilliseconds: 1_000,
    });

    await expect(selected.run()).rejects.toMatchObject({
      axis: cases[0]?.axis,
      capability: "cache",
      code: "case-failed",
    });
    await expect(selected.run()).rejects.not.toThrow("sensitive-provider-detail");
  });

  it("aborts and normalizes a case that exceeds its bound", async () => {
    vi.useFakeTimers();
    const cases = passingCases("cache");
    let signal: AbortSignal | undefined;
    replace(cases[0] ?? {}, "run", async (context: { signal: AbortSignal }) => {
      signal = context.signal;
      await new Promise<void>(() => {});
    });
    const selected = InfrastructureConformanceSuite.define({
      capability: "cache",
      cases,
      timeoutMilliseconds: 50,
    });
    const execution = selected.run();
    const rejected = expect(execution).rejects.toBeInstanceOf(ConformanceExecutionError);
    await vi.advanceTimersByTimeAsync(50);

    await rejected;
    expect(signal?.aborted).toBe(true);
  });

  it("serializes definition and execution errors safely", () => {
    const definition = new ConformanceDefinitionError("missing-axis");
    const execution = new ConformanceExecutionError("case-timeout", "object-storage", "residency");

    expect(JSON.stringify(definition)).toBe('{"code":"missing-axis"}');
    expect(definition.message).not.toContain("provider");
    expect(JSON.stringify(execution)).toBe(
      '{"axis":"residency","capability":"object-storage","code":"case-timeout"}',
    );
  });
});

afterEach(() => {
  vi.useRealTimers();
});
