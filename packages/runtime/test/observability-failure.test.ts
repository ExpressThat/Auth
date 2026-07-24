import { describe, expect, it } from "vitest";
import {
  EpochMilliseconds,
  ObservabilityError,
  TelemetryAttributeSet,
  TelemetryCode,
} from "../src/index.js";
import { observabilityFixture } from "./observability-test-fixture.js";

describe("observability validation, health, and failure", () => {
  it("reports healthy, degraded, and unavailable capabilities", async () => {
    const { adapter } = observabilityFixture();
    await expect(adapter.health()).resolves.toEqual({
      checkedAt: EpochMilliseconds.parse(1_000),
      status: "healthy",
      supportsLogs: true,
      supportsMetrics: true,
      supportsTraces: true,
    });
    adapter.degraded = true;
    await expect(adapter.health()).resolves.toMatchObject({ status: "degraded" });
    adapter.available = false;
    await expect(adapter.health()).resolves.toMatchObject({ status: "unavailable" });
  });

  it("rejects attributes sent to the wrong sink and invalid metric values", async () => {
    const { adapter, correlationId, eventName, logAttributes, metricAttributes, traceAttributes } =
      observabilityFixture();
    await expect(
      adapter.log({
        attributes: traceAttributes,
        correlationId,
        name: eventName,
        occurredAt: EpochMilliseconds.parse(1_000),
        severity: "info",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.metric({
        attributes: logAttributes,
        kind: "counter",
        name: TelemetryCode.parse("requests"),
        observedAt: EpochMilliseconds.parse(1_000),
        unit: TelemetryCode.parse("request"),
        value: 1,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.metric({
        attributes: metricAttributes,
        kind: "histogram",
        name: TelemetryCode.parse("duration"),
        observedAt: EpochMilliseconds.parse(1_000),
        unit: TelemetryCode.parse("millisecond"),
        value: -1,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.metric({
        attributes: metricAttributes,
        kind: "gauge",
        name: TelemetryCode.parse("depth"),
        observedAt: EpochMilliseconds.parse(1_000),
        unit: TelemetryCode.parse("job"),
        value: Number.NaN,
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("rejects a span event carrying non-trace attributes", async () => {
    const { adapter, correlationId, eventName, logAttributes, traceAttributes } =
      observabilityFixture();
    const span = await adapter.startSpan({
      attributes: traceAttributes,
      correlationId,
      kind: "internal",
      name: eventName,
      startedAt: EpochMilliseconds.parse(1_000),
    });
    await expect(
      span.addEvent({
        attributes: logAttributes,
        name: eventName,
        occurredAt: EpochMilliseconds.parse(1_001),
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      span.end({
        endedAt: EpochMilliseconds.parse(1_001),
        errorCode: TelemetryCode.parse("not.an.error"),
        status: "ok",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("normalizes unavailable sinks without embedding telemetry values", async () => {
    const { adapter, correlationId, eventName, logAttributes, metricAttributes, traceAttributes } =
      observabilityFixture();
    adapter.available = false;
    const operations = [
      () =>
        adapter.log({
          attributes: logAttributes,
          correlationId,
          name: eventName,
          occurredAt: EpochMilliseconds.parse(1_000),
          severity: "error" as const,
        }),
      () =>
        adapter.metric({
          attributes: metricAttributes,
          kind: "counter" as const,
          name: TelemetryCode.parse("requests"),
          observedAt: EpochMilliseconds.parse(1_000),
          unit: TelemetryCode.parse("request"),
          value: 1,
        }),
      () =>
        adapter.startSpan({
          attributes: traceAttributes,
          correlationId,
          kind: "server" as const,
          name: eventName,
          startedAt: EpochMilliseconds.parse(1_000),
        }),
    ];
    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({
        code: "unavailable",
        retryable: true,
      });
    }
    const error = new ObservabilityError("log", "unavailable");
    expect(JSON.stringify(error)).toBe('{"code":"unavailable","operation":"log","retryable":true}');
    expect(new ObservabilityError("metric", "invalid").retryable).toBe(false);
    expect(TelemetryAttributeSet.create("log", []).toSinkRecord()).toEqual({});
  });
});
