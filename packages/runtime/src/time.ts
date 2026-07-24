export const MIN_EPOCH_MILLISECONDS = 0;
export const MAX_EPOCH_MILLISECONDS = 253_402_300_799_999;

export class EpochMilliseconds {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): EpochMilliseconds {
    if (
      typeof value !== "number" ||
      !Number.isSafeInteger(value) ||
      value < MIN_EPOCH_MILLISECONDS ||
      value > MAX_EPOCH_MILLISECONDS
    ) {
      throw new RangeError("Instant must be a supported integer Unix epoch millisecond value.");
    }
    return new EpochMilliseconds(value);
  }

  public compare(other: EpochMilliseconds): number {
    return this.#value - other.#value;
  }

  public toJSON(): number {
    return this.#value;
  }

  public valueOf(): number {
    return this.#value;
  }
}

export interface Clock {
  now(): EpochMilliseconds;
}

export class SystemClock implements Clock {
  public now(): EpochMilliseconds {
    return EpochMilliseconds.parse(Date.now());
  }
}
