import type { DataClassification } from "./data-classification.js";
import type {
  CorrelationId,
  DurationBucket,
  HttpMethod,
  PseudonymousTelemetryReference,
  RouteTemplate,
  RuntimeProfile,
  TelemetryCode,
  TelemetryResult,
} from "./observability-values.js";

export type TelemetrySinkKind = "log" | "metric" | "trace";
export type TelemetryCardinality = "high" | "low";
export type TelemetryAttributeValue = boolean | number | string;

export interface TelemetryField<TValue> {
  readonly cardinality: TelemetryCardinality;
  readonly classification: DataClassification;
  readonly name: string;
  readonly sinks: readonly TelemetrySinkKind[];
  serializeValue(value: TValue): TelemetryAttributeValue;
}

class RegisteredTelemetryField<TValue> implements TelemetryField<TValue> {
  public readonly cardinality: TelemetryCardinality;
  public readonly classification: DataClassification;
  public readonly name: string;
  public readonly sinks: readonly TelemetrySinkKind[];
  readonly #serialize: (value: TValue) => TelemetryAttributeValue;

  public constructor(input: {
    cardinality: TelemetryCardinality;
    classification: DataClassification;
    name: string;
    serialize: (value: TValue) => TelemetryAttributeValue;
    sinks: readonly TelemetrySinkKind[];
  }) {
    this.cardinality = input.cardinality;
    this.classification = input.classification;
    this.name = input.name;
    this.#serialize = input.serialize;
    this.sinks = input.sinks;
  }

  public serializeValue(value: TValue): TelemetryAttributeValue {
    return this.#serialize(value);
  }
}

const allSinks = ["log", "metric", "trace"] as const;
const detailedSinks = ["log", "trace"] as const;

export const TELEMETRY_FIELDS = {
  correlationId: new RegisteredTelemetryField<CorrelationId>({
    cardinality: "high",
    classification: "internal",
    name: "correlation.id",
    serialize: (value) => value.value(),
    sinks: detailedSinks,
  }),
  durationBucket: new RegisteredTelemetryField<DurationBucket>({
    cardinality: "low",
    classification: "internal",
    name: "duration.bucket",
    serialize: (value) => value,
    sinks: allSinks,
  }),
  errorCode: new RegisteredTelemetryField<TelemetryCode>({
    cardinality: "low",
    classification: "internal",
    name: "error.code",
    serialize: (value) => value.value(),
    sinks: detailedSinks,
  }),
  httpMethod: new RegisteredTelemetryField<HttpMethod>({
    cardinality: "low",
    classification: "internal",
    name: "http.method",
    serialize: (value) => value,
    sinks: allSinks,
  }),
  httpRoute: new RegisteredTelemetryField<RouteTemplate>({
    cardinality: "low",
    classification: "internal",
    name: "http.route",
    serialize: (value) => value.value(),
    sinks: allSinks,
  }),
  httpStatusCode: new RegisteredTelemetryField<number>({
    cardinality: "low",
    classification: "internal",
    name: "http.status_code",
    serialize: (value) => {
      if (!Number.isInteger(value) || value < 100 || value > 599) {
        throw new TypeError("HTTP telemetry status must be an integer from 100 through 599.");
      }
      return value;
    },
    sinks: allSinks,
  }),
  operation: new RegisteredTelemetryField<TelemetryCode>({
    cardinality: "low",
    classification: "internal",
    name: "auth.operation",
    serialize: (value) => value.value(),
    sinks: allSinks,
  }),
  result: new RegisteredTelemetryField<TelemetryResult>({
    cardinality: "low",
    classification: "internal",
    name: "auth.result",
    serialize: (value) => value,
    sinks: allSinks,
  }),
  runtimeProfile: new RegisteredTelemetryField<RuntimeProfile>({
    cardinality: "low",
    classification: "internal",
    name: "runtime.profile",
    serialize: (value) => value,
    sinks: allSinks,
  }),
  tenantReference: new RegisteredTelemetryField<PseudonymousTelemetryReference>({
    cardinality: "high",
    classification: "personal",
    name: "tenant.reference",
    serialize: (value) => value.value(),
    sinks: detailedSinks,
  }),
} as const;

export class TelemetryAttribute {
  readonly #cardinality: TelemetryCardinality;
  readonly #name: string;
  readonly #sinks: readonly TelemetrySinkKind[];
  readonly #value: TelemetryAttributeValue;

  private constructor(
    cardinality: TelemetryCardinality,
    name: string,
    sinks: readonly TelemetrySinkKind[],
    value: TelemetryAttributeValue,
  ) {
    this.#cardinality = cardinality;
    this.#name = name;
    this.#sinks = sinks;
    this.#value = value;
  }

  public static create<TValue>(field: TelemetryField<TValue>, value: TValue): TelemetryAttribute {
    if (!(field instanceof RegisteredTelemetryField)) {
      throw new TypeError("Telemetry attributes require a registered field descriptor.");
    }
    return new TelemetryAttribute(
      field.cardinality,
      field.name,
      field.sinks,
      field.serializeValue(value),
    );
  }

  public cardinality(): TelemetryCardinality {
    return this.#cardinality;
  }

  public name(): string {
    return this.#name;
  }

  public supports(sink: TelemetrySinkKind): boolean {
    return this.#sinks.includes(sink);
  }

  public value(): TelemetryAttributeValue {
    return this.#value;
  }
}
