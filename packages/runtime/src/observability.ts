import type {
  CorrelationId,
  SpanId,
  TelemetryCode,
  TelemetryEventName,
  TraceId,
} from "./observability-values.js";
import type { TelemetryAttributeSet } from "./telemetry-attribute-set.js";
import type { EpochMilliseconds } from "./time.js";

export type LogSeverity = "debug" | "error" | "info" | "warn";
export type MetricKind = "counter" | "gauge" | "histogram";
export type SpanKind = "client" | "consumer" | "internal" | "producer" | "server";
export type SpanStatus = "error" | "ok" | "unset";
export type ObservabilityHealthStatus = "degraded" | "healthy" | "unavailable";
export type ObservabilityOperation = "health" | "log" | "metric" | "span";
export type ObservabilityErrorCode = "invalid" | "residency-violation" | "unavailable";

export interface StructuredLogEvent {
  readonly attributes: TelemetryAttributeSet;
  readonly correlationId: CorrelationId;
  readonly name: TelemetryEventName;
  readonly occurredAt: EpochMilliseconds;
  readonly severity: LogSeverity;
}

export interface MetricPoint {
  readonly attributes: TelemetryAttributeSet;
  readonly kind: MetricKind;
  readonly name: TelemetryCode;
  readonly observedAt: EpochMilliseconds;
  readonly unit: TelemetryCode;
  readonly value: number;
}

export interface TraceContext {
  readonly sampled: boolean;
  readonly spanId: SpanId;
  readonly traceId: TraceId;
}

export interface StartSpanRequest {
  readonly attributes: TelemetryAttributeSet;
  readonly correlationId: CorrelationId;
  readonly kind: SpanKind;
  readonly name: TelemetryEventName;
  readonly parent?: TraceContext;
  readonly startedAt: EpochMilliseconds;
}

export interface TraceEvent {
  readonly attributes: TelemetryAttributeSet;
  readonly name: TelemetryEventName;
  readonly occurredAt: EpochMilliseconds;
}

export interface EndSpanRequest {
  readonly endedAt: EpochMilliseconds;
  readonly errorCode?: TelemetryCode;
  readonly status: SpanStatus;
}

export interface TraceSpan {
  readonly context: TraceContext;
  addEvent(event: TraceEvent): Promise<void>;
  end(request: EndSpanRequest): Promise<void>;
}

export interface ObservabilityHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: ObservabilityHealthStatus;
  readonly supportsLogs: boolean;
  readonly supportsMetrics: boolean;
  readonly supportsTraces: boolean;
}

export interface ObservabilityProvider {
  health(): Promise<ObservabilityHealth>;
  log(event: StructuredLogEvent): Promise<void>;
  metric(point: MetricPoint): Promise<void>;
  startSpan(request: StartSpanRequest): Promise<TraceSpan>;
}

export class ObservabilityError extends Error {
  public readonly code: ObservabilityErrorCode;
  public readonly operation: ObservabilityOperation;
  public readonly retryable: boolean;

  public constructor(operation: ObservabilityOperation, code: ObservabilityErrorCode) {
    super(`Observability ${operation} failed (${code}).`);
    this.name = "ObservabilityError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: ObservabilityErrorCode;
    operation: ObservabilityOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
