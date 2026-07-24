import { type RandomSource, requireRandomByteLength } from "./random.js";
import { type Clock, EpochMilliseconds } from "./time.js";

export class ControlledClock implements Clock {
  #current: EpochMilliseconds;

  public constructor(initialMilliseconds = 0) {
    this.#current = EpochMilliseconds.parse(initialMilliseconds);
  }

  public advance(milliseconds: number): void {
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
      throw new RangeError("Clock advance must be a non-negative safe integer.");
    }
    this.#current = EpochMilliseconds.parse(Number(this.#current) + milliseconds);
  }

  public now(): EpochMilliseconds {
    return this.#current;
  }

  public set(milliseconds: number): void {
    this.#current = EpochMilliseconds.parse(milliseconds);
  }
}

export class SequenceRandomSource implements RandomSource {
  readonly #values: Uint8Array[];
  #index = 0;

  public constructor(values: readonly Uint8Array[]) {
    this.#values = values.map((value) => Uint8Array.from(value));
  }

  public bytes(length: number): Uint8Array {
    requireRandomByteLength(length);
    const selected = this.#values[this.#index];

    if (selected === undefined) {
      throw new Error("Deterministic random sequence is exhausted.");
    }
    if (selected.length !== length) {
      throw new RangeError(
        `Expected ${String(length)} deterministic bytes, received ${String(selected.length)}.`,
      );
    }

    this.#index += 1;
    return Uint8Array.from(selected);
  }

  public remaining(): number {
    return this.#values.length - this.#index;
  }
}
