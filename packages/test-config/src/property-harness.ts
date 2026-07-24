export type PropertyContext = {
  iteration: number;
  random: DeterministicRandom;
  seed: number;
};

export type PropertyCampaign = {
  iterations: number;
  property(context: PropertyContext): void;
  seed: number;
};

const MAX_ITERATIONS = 100_000;
const MAX_UINT32 = 0xffffffff;
// biome-ignore lint/security/noSecrets: This is the public alphabet for synthetic fuzz text.
const DEFAULT_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export class DeterministicRandom {
  #state: number;

  public constructor(seed: number) {
    if (!Number.isSafeInteger(seed) || seed < 1 || seed > MAX_UINT32) {
      throw new RangeError("Property seed must be an unsigned non-zero 32-bit integer.");
    }
    this.#state = seed;
  }

  public integer(minimum: number, maximum: number): number {
    if (!Number.isSafeInteger(minimum) || !Number.isSafeInteger(maximum) || minimum > maximum) {
      throw new RangeError("Random integer bounds must be ordered safe integers.");
    }
    const span = maximum - minimum + 1;
    if (!Number.isSafeInteger(span) || span < 1) {
      throw new RangeError("Random integer span is outside the supported range.");
    }
    return minimum + (this.nextUint32() % span);
  }

  public pick<T>(values: ReadonlyArray<T>): T {
    if (values.length === 0) {
      throw new RangeError("Cannot pick from an empty property corpus.");
    }
    const selected = values[this.integer(0, values.length - 1)];
    if (selected === undefined) {
      throw new Error("Deterministic random selection failed.");
    }
    return selected;
  }

  public text(length: number, alphabet = DEFAULT_ALPHABET): string {
    if (!Number.isSafeInteger(length) || length < 0) {
      throw new RangeError("Generated text length must be a non-negative safe integer.");
    }
    if (alphabet.length === 0) {
      throw new RangeError("Generated text alphabet must not be empty.");
    }
    return Array.from({ length }, () => this.pick([...alphabet])).join("");
  }

  private nextUint32(): number {
    let value = this.#state;
    value ^= value << 13;
    value ^= value >>> 17;
    value ^= value << 5;
    this.#state = value >>> 0;
    return this.#state;
  }
}

export function runPropertyCampaign(campaign: PropertyCampaign): void {
  if (
    !Number.isSafeInteger(campaign.iterations) ||
    campaign.iterations < 1 ||
    campaign.iterations > MAX_ITERATIONS
  ) {
    throw new RangeError(`Property iterations must be between 1 and ${MAX_ITERATIONS}.`);
  }

  const random = new DeterministicRandom(campaign.seed);
  for (let iteration = 0; iteration < campaign.iterations; iteration += 1) {
    try {
      campaign.property({ iteration, random, seed: campaign.seed });
    } catch (error: unknown) {
      const detail = error instanceof Error ? error.message : "unknown property failure";
      throw new Error(
        `Property failed for seed ${campaign.seed} at iteration ${iteration}: ${detail}`,
        { cause: error },
      );
    }
  }
}
