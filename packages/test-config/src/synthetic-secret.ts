export type RedactedSecret = {
  fingerprint: string;
  kind: string;
  redactedValue: "[REDACTED]";
};

export class SyntheticSecret {
  readonly #value: string;
  public readonly fingerprint: string;
  public readonly kind: string;

  public constructor(kind: string, sequence: number) {
    this.kind = kind;
    this.fingerprint = `test-${kind}-${sequence.toString().padStart(6, "0")}`;
    this.#value = `test-only-${kind}-${sequence.toString().padStart(6, "0")}-${"x".repeat(32)}`;
  }

  public revealForTest(): string {
    return this.#value;
  }

  public toJSON(): RedactedSecret {
    return {
      fingerprint: this.fingerprint,
      kind: this.kind,
      redactedValue: "[REDACTED]",
    };
  }
}
