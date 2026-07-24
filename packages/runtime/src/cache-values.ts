import { PublicEntityId } from "./identifier.js";
import type { EpochMilliseconds } from "./time.js";

export const MAX_CACHE_VALUE_BYTES = 1_048_576;
const MAX_CACHE_SEGMENT_LENGTH = 200;

function parseSegment(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_CACHE_SEGMENT_LENGTH ||
    !/^[A-Za-z0-9._:/-]+$/u.test(value)
  ) {
    throw new TypeError(`${label} must use the bounded opaque format.`);
  }
  return value;
}

export class CachePurpose {
  readonly #value: string;

  private constructor(value: unknown) {
    this.#value = parseSegment(value, "Cache purpose");
  }

  public static parse(value: unknown): CachePurpose {
    return new CachePurpose(value);
  }

  public identifier(): string {
    return this.#value;
  }
}

export class CachePolicyVersion {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): CachePolicyVersion {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
      throw new TypeError("Cache policy version must be a positive safe integer.");
    }
    return new CachePolicyVersion(value);
  }

  public numberValue(): number {
    return this.#value;
  }
}

export interface CacheScopeInput {
  readonly applicationId?: PublicEntityId<"app">;
  readonly customerOrganisationId: PublicEntityId<"org">;
  readonly environmentId: PublicEntityId<"env">;
  readonly policyVersion: CachePolicyVersion;
  readonly purpose: CachePurpose;
}

export class CacheScope {
  readonly #providerPrefix: string;

  private constructor(input: CacheScopeInput) {
    const fields = [
      input.customerOrganisationId.toString(),
      input.environmentId.toString(),
      input.applicationId?.toString() ?? "-",
      input.purpose.identifier(),
      String(input.policyVersion.numberValue()),
    ];
    this.#providerPrefix = fields.map((field) => `${String(field.length)}:${field}`).join("|");
  }

  public static create(input: CacheScopeInput): CacheScope {
    if (
      !(input.customerOrganisationId instanceof PublicEntityId) ||
      input.customerOrganisationId.prefix !== "org" ||
      !(input.environmentId instanceof PublicEntityId) ||
      input.environmentId.prefix !== "env" ||
      (input.applicationId !== undefined &&
        (!(input.applicationId instanceof PublicEntityId) ||
          input.applicationId.prefix !== "app")) ||
      !(input.purpose instanceof CachePurpose) ||
      !(input.policyVersion instanceof CachePolicyVersion)
    ) {
      throw new TypeError("Cache scope must contain trusted typed identifiers and policy values.");
    }
    return new CacheScope(input);
  }

  public providerPrefix(): string {
    return this.#providerPrefix;
  }

  public toJSON(): string {
    return "[REDACTED CACHE SCOPE]";
  }
}

export class CacheKey {
  readonly #providerKey: string;

  private constructor(scope: CacheScope, key: unknown) {
    const parsed = parseSegment(key, "Cache key");
    this.#providerKey = `${scope.providerPrefix()}|${String(parsed.length)}:${parsed}`;
  }

  public static create(scope: CacheScope, key: unknown): CacheKey {
    return new CacheKey(scope, key);
  }

  public providerKey(): string {
    return this.#providerKey;
  }

  public toJSON(): string {
    return "[REDACTED CACHE KEY]";
  }
}

export class CacheValue {
  readonly #bytes: Uint8Array;

  private constructor(bytes: Uint8Array) {
    this.#bytes = Uint8Array.from(bytes);
  }

  public static fromBytes(value: unknown): CacheValue {
    if (
      !(value instanceof Uint8Array) ||
      value.length < 1 ||
      value.length > MAX_CACHE_VALUE_BYTES
    ) {
      throw new TypeError("Cache value must be a bounded non-empty byte array.");
    }
    return new CacheValue(value);
  }

  public byteLength(): number {
    return this.#bytes.length;
  }

  public copyForProvider(): Uint8Array {
    return Uint8Array.from(this.#bytes);
  }

  public toJSON(): string {
    return "[REDACTED CACHE VALUE]";
  }
}

export class CacheVersion {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): CacheVersion {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
      throw new TypeError("Cache version must be a positive safe integer.");
    }
    return new CacheVersion(value);
  }

  public numberValue(): number {
    return this.#value;
  }
}

export interface CacheEntry {
  readonly expiresAt: EpochMilliseconds;
  readonly value: CacheValue;
  readonly version: CacheVersion;
}
