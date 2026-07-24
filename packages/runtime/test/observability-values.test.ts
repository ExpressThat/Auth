import { describe, expect, it } from "vitest";
import {
  CorrelationId,
  EntityId,
  PseudonymousTelemetryReference,
  RouteTemplate,
  SpanId,
  TelemetryCode,
  TelemetryEventName,
  TraceId,
} from "../src/index.js";

describe("observability values", () => {
  it("validates low-cardinality codes and separates audit event names", () => {
    expect(TelemetryCode.parse("auth.login_failed").value()).toBe("auth.login_failed");
    expect(TelemetryEventName.parse("request.completed").value()).toBe("request.completed");
    expect(() => TelemetryCode.parse("Contains Spaces")).toThrow(TypeError);
    expect(() => TelemetryCode.parse("x".repeat(101))).toThrow(TypeError);
    expect(() => TelemetryCode.parse(1)).toThrow(TypeError);
    expect(() => TelemetryEventName.parse("audit")).toThrow(TypeError);
    expect(() => TelemetryEventName.parse("audit.user.changed")).toThrow(TypeError);
  });

  it("accepts parameterized route templates but rejects raw paths and queries", () => {
    expect(RouteTemplate.parse("/v1/users/{userId}").value()).toBe("/v1/users/{userId}");
    expect(() => RouteTemplate.parse("/v1/users/019c1234")).toThrow(TypeError);
    expect(() => RouteTemplate.parse("/v1/users?email=person@example.test")).toThrow(TypeError);
    expect(() => RouteTemplate.parse("v1/users")).toThrow(TypeError);
    expect(() => RouteTemplate.parse("x".repeat(201))).toThrow(TypeError);
    expect(() => RouteTemplate.parse(1)).toThrow(TypeError);
  });

  it("requires typed correlation and exact-size trace identifiers", () => {
    const entity = EntityId.parse("01234567-89ab-7001-8203-040506070809");
    expect(CorrelationId.fromEntityId(entity).value()).toBe(entity.toString());
    expect(TraceId.fromBytes(new Uint8Array(16).fill(1)).value()).toHaveLength(32);
    expect(SpanId.fromBytes(new Uint8Array(8).fill(1)).value()).toHaveLength(16);
    expect(
      PseudonymousTelemetryReference.fromDigestPrefix(new Uint8Array(16).fill(2)).value(),
    ).toHaveLength(32);
    expect(() => CorrelationId.fromEntityId(entity.toString())).toThrow(TypeError);
    expect(() => TraceId.fromBytes(new Uint8Array(15))).toThrow(TypeError);
    expect(() => SpanId.fromBytes("span")).toThrow(TypeError);
    expect(() => PseudonymousTelemetryReference.fromDigestPrefix(new Uint8Array(15))).toThrow(
      TypeError,
    );
  });
});
