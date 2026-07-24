import type { EndSpanRequest, TraceContext, TraceEvent, TraceSpan } from "../index.js";
import { ObservabilityError } from "../index.js";

export class TestTraceSpan implements TraceSpan {
  public readonly context: TraceContext;
  public readonly events: TraceEvent[] = [];
  public endedWith: EndSpanRequest | undefined;

  public constructor(context: TraceContext) {
    this.context = context;
  }

  public async addEvent(event: TraceEvent): Promise<void> {
    if (this.endedWith || event.attributes.sink !== "trace") {
      throw new ObservabilityError("span", "invalid");
    }
    this.events.push(event);
  }

  public async end(request: EndSpanRequest): Promise<void> {
    if (
      this.endedWith ||
      (request.status === "error" && !request.errorCode) ||
      (request.status !== "error" && request.errorCode)
    ) {
      throw new ObservabilityError("span", "invalid");
    }
    this.endedWith = request;
  }
}
