import type {
  Clock,
  MetricPoint,
  ObservabilityHealth,
  ObservabilityOperation,
  ObservabilityProvider,
  RandomSource,
  StartSpanRequest,
  StructuredLogEvent,
  TraceSpan,
} from "../src/index.js";
import { ObservabilityError, SpanId, TraceId } from "../src/index.js";
import { TestTraceSpan } from "./observability-test-span.js";

export class TestObservabilityAdapter implements ObservabilityProvider {
  readonly #clock: Clock;
  readonly #random: RandomSource;
  public available = true;
  public degraded = false;
  public readonly logs: StructuredLogEvent[] = [];
  public readonly metrics: MetricPoint[] = [];
  public readonly spans: TestTraceSpan[] = [];

  public constructor(clock: Clock, random: RandomSource) {
    this.#clock = clock;
    this.#random = random;
  }

  public async health(): Promise<ObservabilityHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.available ? (this.degraded ? "degraded" : "healthy") : "unavailable",
      supportsLogs: true,
      supportsMetrics: true,
      supportsTraces: true,
    };
  }

  public async log(event: StructuredLogEvent): Promise<void> {
    this.#requireAvailable("log");
    if (event.attributes.sink !== "log") {
      throw new ObservabilityError("log", "invalid");
    }
    this.logs.push(event);
  }

  public async metric(point: MetricPoint): Promise<void> {
    this.#requireAvailable("metric");
    const nonNegative = point.kind === "counter" || point.kind === "histogram";
    if (
      point.attributes.sink !== "metric" ||
      !Number.isFinite(point.value) ||
      (nonNegative && point.value < 0)
    ) {
      throw new ObservabilityError("metric", "invalid");
    }
    this.metrics.push(point);
  }

  public async startSpan(request: StartSpanRequest): Promise<TraceSpan> {
    this.#requireAvailable("span");
    if (request.attributes.sink !== "trace") {
      throw new ObservabilityError("span", "invalid");
    }
    const context = {
      sampled: request.parent?.sampled ?? true,
      spanId: SpanId.fromBytes(this.#random.bytes(8)),
      traceId: request.parent?.traceId ?? TraceId.fromBytes(this.#random.bytes(16)),
    };
    const span = new TestTraceSpan(context);
    this.spans.push(span);
    return span;
  }

  #requireAvailable(operation: ObservabilityOperation): void {
    if (!this.available) {
      throw new ObservabilityError(operation, "unavailable");
    }
  }
}
