function requireNonNegativeInteger(value: number, label: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a non-negative safe integer.`);
  }
}

export class ControlledClock {
  private currentMilliseconds: number;

  public constructor(initialMilliseconds = 0) {
    requireNonNegativeInteger(initialMilliseconds, "Initial time");
    this.currentMilliseconds = initialMilliseconds;
  }

  public advance(milliseconds: number): void {
    requireNonNegativeInteger(milliseconds, "Clock advance");
    const next = this.currentMilliseconds + milliseconds;
    requireNonNegativeInteger(next, "Advanced time");
    this.currentMilliseconds = next;
  }

  public now(): number {
    return this.currentMilliseconds;
  }

  public set(milliseconds: number): void {
    requireNonNegativeInteger(milliseconds, "Clock time");
    this.currentMilliseconds = milliseconds;
  }
}

export class SequenceRandom {
  private readonly values: Uint8Array[];
  private index = 0;

  public constructor(values: Uint8Array[]) {
    this.values = values.map((value) => Uint8Array.from(value));
  }

  public bytes(length: number): Uint8Array {
    requireNonNegativeInteger(length, "Random byte length");
    const selected = this.values[this.index];

    if (selected === undefined) {
      throw new Error("The deterministic random sequence is exhausted.");
    }
    if (selected.length !== length) {
      throw new RangeError(`Expected ${length} deterministic bytes, received ${selected.length}.`);
    }

    this.index += 1;
    return Uint8Array.from(selected);
  }

  public remaining(): number {
    return this.values.length - this.index;
  }
}
