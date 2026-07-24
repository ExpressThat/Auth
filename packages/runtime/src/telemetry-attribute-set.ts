import type { TelemetryAttributeValue, TelemetrySinkKind } from "./telemetry-attributes.js";
import { TelemetryAttribute } from "./telemetry-attributes.js";

export class TelemetryAttributeSet {
  readonly #attributes: readonly TelemetryAttribute[];
  public readonly sink: TelemetrySinkKind;

  private constructor(sink: TelemetrySinkKind, attributes: readonly TelemetryAttribute[]) {
    this.sink = sink;
    this.#attributes = [...attributes];
  }

  public static create(
    sink: TelemetrySinkKind,
    attributes: readonly TelemetryAttribute[],
  ): TelemetryAttributeSet {
    const maximum = sink === "metric" ? 10 : 32;
    if (attributes.length > maximum) {
      throw new TypeError("Telemetry attribute set exceeds the sink field limit.");
    }
    const names = new Set<string>();
    for (const attribute of attributes) {
      if (!(attribute instanceof TelemetryAttribute) || !attribute.supports(sink)) {
        throw new TypeError("Telemetry attribute is not registered for the selected sink.");
      }
      if (names.has(attribute.name())) {
        throw new TypeError("Telemetry attribute names must be unique.");
      }
      names.add(attribute.name());
    }
    return new TelemetryAttributeSet(sink, attributes);
  }

  public toSinkRecord(): Readonly<Record<string, TelemetryAttributeValue>> {
    return Object.fromEntries(
      this.#attributes.map((attribute) => [attribute.name(), attribute.value()]),
    );
  }
}
