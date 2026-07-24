import { describe, expect, it } from "vitest";
import { EpochMilliseconds, TelemetryCode, TelemetryEventName } from "../src/index.js";
import { observabilityFixture } from "./observability-test-fixture.js";

describe("observability provider contract", () => {
  it("emits message-free structured logs with correlation", async () => {
    const { adapter, correlationId, eventName, logAttributes } = observabilityFixture();
    await adapter.log({
      attributes: logAttributes,
      correlationId,
      name: eventName,
      occurredAt: EpochMilliseconds.parse(1_000),
      severity: "info",
    });

    expect(adapter.logs).toHaveLength(1);
    expect(adapter.logs[0]?.attributes.toSinkRecord()).toEqual({
      "auth.operation": "auth.login",
    });
    expect(JSON.stringify(adapter.logs)).not.toContain("message");
  });

  it("records finite metrics with metric-only low-cardinality labels", async () => {
    const { adapter, metricAttributes } = observabilityFixture();
    await adapter.metric({
      attributes: metricAttributes,
      kind: "counter",
      name: TelemetryCode.parse("auth.requests"),
      observedAt: EpochMilliseconds.parse(1_000),
      unit: TelemetryCode.parse("request"),
      value: 1,
    });
    await adapter.metric({
      attributes: metricAttributes,
      kind: "gauge",
      name: TelemetryCode.parse("queue.depth"),
      observedAt: EpochMilliseconds.parse(1_000),
      unit: TelemetryCode.parse("job"),
      value: -1,
    });

    expect(adapter.metrics).toHaveLength(2);
  });

  it("creates correlated parent-child spans and enforces span lifecycle", async () => {
    const { adapter, correlationId, eventName, traceAttributes } = observabilityFixture();
    const parent = await adapter.startSpan({
      attributes: traceAttributes,
      correlationId,
      kind: "server",
      name: eventName,
      startedAt: EpochMilliseconds.parse(1_000),
    });
    const child = await adapter.startSpan({
      attributes: traceAttributes,
      correlationId,
      kind: "internal",
      name: TelemetryEventName.parse("token.issue"),
      parent: parent.context,
      startedAt: EpochMilliseconds.parse(1_001),
    });
    await child.addEvent({
      attributes: traceAttributes,
      name: TelemetryEventName.parse("key.selected"),
      occurredAt: EpochMilliseconds.parse(1_002),
    });
    await child.end({
      endedAt: EpochMilliseconds.parse(1_003),
      status: "ok",
    });

    expect(child.context.traceId.value()).toBe(parent.context.traceId.value());
    expect(child.context.spanId.value()).not.toBe(parent.context.spanId.value());
    expect(adapter.spans.at(1)?.events).toHaveLength(1);
    await expect(
      child.addEvent({
        attributes: traceAttributes,
        name: eventName,
        occurredAt: EpochMilliseconds.parse(1_004),
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      child.end({
        endedAt: EpochMilliseconds.parse(1_004),
        status: "ok",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("requires a safe code exactly when a span ends in error", async () => {
    const { adapter, correlationId, eventName, traceAttributes } = observabilityFixture();
    const span = await adapter.startSpan({
      attributes: traceAttributes,
      correlationId,
      kind: "consumer",
      name: eventName,
      startedAt: EpochMilliseconds.parse(1_000),
    });
    await expect(
      span.end({
        endedAt: EpochMilliseconds.parse(1_001),
        status: "error",
      }),
    ).rejects.toMatchObject({ code: "invalid" });
    await span.end({
      endedAt: EpochMilliseconds.parse(1_001),
      errorCode: TelemetryCode.parse("provider.unavailable"),
      status: "error",
    });
  });
});
