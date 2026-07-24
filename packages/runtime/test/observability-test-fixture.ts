import {
  CorrelationId,
  EntityId,
  TELEMETRY_FIELDS,
  TelemetryAttribute,
  TelemetryAttributeSet,
  TelemetryCode,
  TelemetryEventName,
} from "../src/index.js";
import { ControlledClock, SequenceRandomSource } from "../src/testing.js";
import { TestObservabilityAdapter } from "./observability-test-adapter.js";

export function observabilityFixture() {
  const clock = new ControlledClock(1_000);
  const random = new SequenceRandomSource([
    new Uint8Array(8).fill(1),
    new Uint8Array(16).fill(2),
    new Uint8Array(8).fill(3),
  ]);
  const adapter = new TestObservabilityAdapter(clock, random);
  const correlationId = CorrelationId.fromEntityId(
    EntityId.parse("01234567-89ab-7001-8203-040506070809"),
  );
  const operation = TelemetryAttribute.create(
    TELEMETRY_FIELDS.operation,
    TelemetryCode.parse("auth.login"),
  );
  return {
    adapter,
    clock,
    correlationId,
    eventName: TelemetryEventName.parse("request.completed"),
    logAttributes: TelemetryAttributeSet.create("log", [operation]),
    metricAttributes: TelemetryAttributeSet.create("metric", [operation]),
    traceAttributes: TelemetryAttributeSet.create("trace", [operation]),
  };
}
