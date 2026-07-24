import { describe, expect, it } from "vitest";
import {
  CorrelationId,
  EntityId,
  PseudonymousTelemetryReference,
  RouteTemplate,
  TELEMETRY_FIELDS,
  TelemetryAttribute,
  TelemetryAttributeSet,
  TelemetryCode,
} from "../src/index.js";

describe("telemetry attribute registry", () => {
  it("serializes only registered typed fields into a safe sink record", () => {
    const attributes = TelemetryAttributeSet.create("log", [
      TelemetryAttribute.create(TELEMETRY_FIELDS.operation, TelemetryCode.parse("login")),
      TelemetryAttribute.create(TELEMETRY_FIELDS.result, "success"),
      TelemetryAttribute.create(TELEMETRY_FIELDS.durationBucket, "25-100ms"),
      TelemetryAttribute.create(
        TELEMETRY_FIELDS.errorCode,
        TelemetryCode.parse("invalid.credentials"),
      ),
      TelemetryAttribute.create(TELEMETRY_FIELDS.httpMethod, "POST"),
      TelemetryAttribute.create(TELEMETRY_FIELDS.httpStatusCode, 200),
      TelemetryAttribute.create(
        TELEMETRY_FIELDS.httpRoute,
        RouteTemplate.parse("/v1/users/{userId}"),
      ),
      TelemetryAttribute.create(TELEMETRY_FIELDS.runtimeProfile, "production"),
    ]);

    expect(attributes.toSinkRecord()).toEqual({
      "auth.operation": "login",
      "auth.result": "success",
      "duration.bucket": "25-100ms",
      "error.code": "invalid.credentials",
      "http.method": "POST",
      "http.route": "/v1/users/{userId}",
      "http.status_code": 200,
      "runtime.profile": "production",
    });
    expect(attributes.sink).toBe("log");
    expect(
      TelemetryAttribute.create(
        TELEMETRY_FIELDS.operation,
        TelemetryCode.parse("login"),
      ).cardinality(),
    ).toBe("low");
  });

  it("permits pseudonymous references in restricted sinks but never metrics", () => {
    const tenant = TelemetryAttribute.create(
      TELEMETRY_FIELDS.tenantReference,
      PseudonymousTelemetryReference.fromDigestPrefix(new Uint8Array(16).fill(1)),
    );
    const correlation = TelemetryAttribute.create(
      TELEMETRY_FIELDS.correlationId,
      CorrelationId.fromEntityId(EntityId.parse("01234567-89ab-7001-8203-040506070809")),
    );
    expect(TelemetryAttributeSet.create("trace", [tenant, correlation]).toSinkRecord()).toEqual({
      "correlation.id": "01234567-89ab-7001-8203-040506070809",
      "tenant.reference": "01010101010101010101010101010101",
    });
    expect(() => TelemetryAttributeSet.create("metric", [tenant])).toThrow(TypeError);
    expect(() => TelemetryAttributeSet.create("metric", [correlation])).toThrow(TypeError);
  });

  it("rejects duplicates, invalid status, excess fields, and forged descriptors", () => {
    const operation = TelemetryAttribute.create(
      TELEMETRY_FIELDS.operation,
      TelemetryCode.parse("login"),
    );
    expect(() => TelemetryAttributeSet.create("log", [operation, operation])).toThrow(TypeError);
    expect(() => TelemetryAttribute.create(TELEMETRY_FIELDS.httpStatusCode, 99)).toThrow(TypeError);
    expect(() =>
      TelemetryAttributeSet.create(
        "log",
        Array.from({ length: 33 }, () => operation),
      ),
    ).toThrow(TypeError);
    expect(() =>
      TelemetryAttribute.create(
        {
          cardinality: "low",
          classification: "internal",
          name: "raw",
          serializeValue: (value: string) => value,
          sinks: ["log"],
        },
        "secret",
      ),
    ).toThrow(TypeError);
  });

  it("does not accept raw personal, credential, or secret strings", () => {
    expect(() =>
      TelemetryAttribute.create(
        TELEMETRY_FIELDS.operation,
        // @ts-expect-error -- raw strings cannot enter typed telemetry fields.
        "canary-secret-value",
      ),
    ).toThrow(TypeError);
    expect(JSON.stringify(TELEMETRY_FIELDS)).not.toContain("canary-secret-value");
  });
});
