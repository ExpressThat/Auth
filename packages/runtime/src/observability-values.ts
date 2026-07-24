import { EntityId } from "./identifier.js";

const CODE_PATTERN = /^[a-z][a-z0-9]*(?:[._-][a-z0-9]+)*$/u;

export class TelemetryCode {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): TelemetryCode {
    if (typeof value !== "string" || value.length > 100 || !CODE_PATTERN.test(value)) {
      throw new TypeError("Telemetry code must use the bounded low-cardinality format.");
    }
    return new TelemetryCode(value);
  }

  public value(): string {
    return this.#value;
  }
}

export class TelemetryEventName {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): TelemetryEventName {
    const parsed = TelemetryCode.parse(value).value();
    if (parsed === "audit" || parsed.startsWith("audit.")) {
      throw new TypeError("Audit events must use the separate durable audit boundary.");
    }
    return new TelemetryEventName(parsed);
  }

  public value(): string {
    return this.#value;
  }
}

export class CorrelationId {
  readonly #value: EntityId;

  private constructor(value: EntityId) {
    this.#value = value;
  }

  public static fromEntityId(value: unknown): CorrelationId {
    if (!(value instanceof EntityId)) {
      throw new TypeError("Correlation ID must be a validated entity identifier.");
    }
    return new CorrelationId(value);
  }

  public value(): string {
    return this.#value.toString();
  }
}

abstract class HexTelemetryId {
  readonly #value: string;

  protected constructor(value: unknown, byteLength: number, label: string) {
    if (!(value instanceof Uint8Array) || value.length !== byteLength) {
      throw new TypeError(`${label} must contain exactly ${String(byteLength)} bytes.`);
    }
    this.#value = [...value].map((byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  public value(): string {
    return this.#value;
  }
}

export class TraceId extends HexTelemetryId {
  private constructor(value: unknown) {
    super(value, 16, "Trace ID");
  }

  public static fromBytes(value: unknown): TraceId {
    return new TraceId(value);
  }
}

export class SpanId extends HexTelemetryId {
  private constructor(value: unknown) {
    super(value, 8, "Span ID");
  }

  public static fromBytes(value: unknown): SpanId {
    return new SpanId(value);
  }
}

export class PseudonymousTelemetryReference extends HexTelemetryId {
  private constructor(value: unknown) {
    super(value, 16, "Pseudonymous telemetry reference");
  }

  public static fromDigestPrefix(value: unknown): PseudonymousTelemetryReference {
    return new PseudonymousTelemetryReference(value);
  }
}

export class RouteTemplate {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): RouteTemplate {
    if (
      typeof value !== "string" ||
      value.length < 1 ||
      value.length > 200 ||
      !/^\/(?:[A-Za-z][A-Za-z0-9._~-]*|\{[a-z][a-zA-Z0-9]*\})(?:\/(?:[A-Za-z][A-Za-z0-9._~-]*|\{[a-z][a-zA-Z0-9]*\}))*$/u.test(
        value,
      )
    ) {
      throw new TypeError("Route template must be a bounded parameterized path without a query.");
    }
    return new RouteTemplate(value);
  }

  public value(): string {
    return this.#value;
  }
}

export type TelemetryResult = "cancelled" | "denied" | "failure" | "success";
export type RuntimeProfile = "development" | "production" | "test";
export type HttpMethod = "DELETE" | "GET" | "HEAD" | "OPTIONS" | "PATCH" | "POST" | "PUT";
export type DurationBucket =
  | "0-5ms"
  | "5-25ms"
  | "25-100ms"
  | "100-500ms"
  | "500-2000ms"
  | "2000ms+";
