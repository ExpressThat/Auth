const NAMESPACED_NAME_PATTERN =
  /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)+$/u;
const SCHEMA_NAME_PATTERN = /^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*$/u;
const SHA_256_PATTERN = /^[0-9a-f]{64}$/u;
const SEMANTIC_VERSION_PATTERN =
  /^(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;

function parseBoundedName(
  value: unknown,
  pattern: RegExp,
  label: string,
  maximumLength: number,
): string {
  if (typeof value !== "string" || value.length > maximumLength || !pattern.test(value)) {
    throw new TypeError(`${label} is invalid.`);
  }
  return value;
}

export class RuntimeCapability {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): RuntimeCapability {
    return new RuntimeCapability(
      parseBoundedName(value, NAMESPACED_NAME_PATTERN, "Runtime capability", 96),
    );
  }

  public equals(other: RuntimeCapability): boolean {
    return this.#value === other.#value;
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class AdapterIdentifier {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): AdapterIdentifier {
    return new AdapterIdentifier(
      parseBoundedName(value, NAMESPACED_NAME_PATTERN, "Adapter identifier", 128),
    );
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class SchemaIdentifier {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): SchemaIdentifier {
    return new SchemaIdentifier(
      parseBoundedName(value, SCHEMA_NAME_PATTERN, "Schema identifier", 96),
    );
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class SchemaDigest {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): SchemaDigest {
    if (typeof value !== "string" || !SHA_256_PATTERN.test(value)) {
      throw new TypeError("Schema digest must be a lowercase SHA-256 digest.");
    }
    return new SchemaDigest(value);
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class SchemaVersion {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): SchemaVersion {
    if (!Number.isSafeInteger(value) || typeof value !== "number" || value < 1) {
      throw new TypeError("Schema version must be a positive safe integer.");
    }
    return new SchemaVersion(value);
  }

  public toJSON(): number {
    return this.#value;
  }

  public valueOf(): number {
    return this.#value;
  }
}

export class SemanticVersion {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): SemanticVersion {
    if (typeof value !== "string" || value.length > 128 || !SEMANTIC_VERSION_PATTERN.test(value)) {
      throw new TypeError("Adapter version must be a valid semantic version.");
    }
    return new SemanticVersion(value);
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}
