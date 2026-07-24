import {
  CorrelationId,
  EntityId,
  EpochMilliseconds,
  ObservabilityError,
  TELEMETRY_FIELDS,
  TelemetryAttribute,
  TelemetryAttributeSet,
  TelemetryCode,
  TelemetryEventName,
} from "@expressthat-auth/runtime";
import {
  ControlledClock,
  SequenceRandomSource,
  TestObservabilityAdapter,
} from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineObservabilityConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";

function fixture() {
  const adapter = new TestObservabilityAdapter(
    new ControlledClock(1_000),
    new SequenceRandomSource([new Uint8Array(8), new Uint8Array(16)]),
  );
  const correlationId = CorrelationId.fromEntityId(
    EntityId.parse("01234567-89ab-7001-8203-040506070809"),
  );
  const attributes = TelemetryAttributeSet.create("log", [
    TelemetryAttribute.create(TELEMETRY_FIELDS.operation, TelemetryCode.parse("auth.login")),
  ]);
  return {
    adapter,
    event: {
      attributes,
      correlationId,
      name: TelemetryEventName.parse("request.completed"),
      occurredAt: EpochMilliseconds.parse(1_000),
      severity: "info" as const,
    },
  };
}

describe("deterministic observability adapter conformance", () => {
  it("passes every observability conformance axis", async () => {
    const suite = defineObservabilityConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, event } = fixture();
          return Promise.allSettled([adapter.log(event), adapter.log(event), adapter.log(event)]);
        },
        failure: async () => {
          const { adapter, event } = fixture();
          return adapter.metric({
            ...event,
            attributes: event.attributes,
            kind: "counter",
            name: TelemetryCode.parse("auth.requests"),
            observedAt: event.occurredAt,
            unit: TelemetryCode.parse("request"),
            value: 1,
          });
        },
        health: async () => {
          const { adapter } = fixture();
          expect((await adapter.health()).supportsTraces).toBe(true);
          adapter.degraded = true;
          expect((await adapter.health()).status).toBe("degraded");
        },
        redaction: async () => {
          const { adapter, event } = fixture();
          adapter.available = false;
          return adapter
            .log({
              ...event,
              name: TelemetryEventName.parse("redaction.checked"),
            })
            .catch((error: unknown) => error);
        },
        residency: async () => {
          const first = fixture();
          const second = fixture();
          await first.adapter.log(first.event);
          expect(first.adapter.logs).toHaveLength(1);
          expect(second.adapter.logs).toHaveLength(0);
        },
        retry: async () => Promise.reject(new ObservabilityError("log", "unavailable")),
        success: async () => {
          const { adapter, event } = fixture();
          await adapter.log(event);
          expect(adapter.logs).toHaveLength(1);
          expect(JSON.stringify(adapter.logs)).not.toContain(conformanceCanary());
        },
      }),
      2_000,
    );
    expect((await suite.run()).results).toHaveLength(9);
  });
});
