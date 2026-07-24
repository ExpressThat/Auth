import type { EpochMilliseconds } from "./time.js";

export const MAX_SECRET_BYTES = 65_536;

export type SecretStorageOperation = "create" | "disable" | "metadata" | "resolve" | "rotate";
export type SecretStorageErrorCode =
  | "conflict"
  | "disabled"
  | "invalid"
  | "not-found"
  | "purpose-mismatch"
  | "residency-violation"
  | "unavailable";
export type SecretVersionState = "active" | "disabled" | "superseded";

export class SecretMaterial {
  readonly #bytes: Uint8Array;
  #destroyed = false;

  private constructor(bytes: Uint8Array) {
    this.#bytes = Uint8Array.from(bytes);
  }

  public static fromBytes(value: unknown): SecretMaterial {
    if (!(value instanceof Uint8Array) || value.length === 0 || value.length > MAX_SECRET_BYTES) {
      throw new TypeError("Secret material must be a bounded non-empty byte array.");
    }
    return new SecretMaterial(value);
  }

  public static fromUtf8(value: unknown): SecretMaterial {
    if (typeof value !== "string") {
      throw new TypeError("Secret material must be a string.");
    }
    return SecretMaterial.fromBytes(new TextEncoder().encode(value));
  }

  public byteLength(): number {
    return this.#bytes.length;
  }

  public copyForProvider(): Uint8Array {
    if (this.#destroyed) {
      throw new Error("Secret material has been destroyed.");
    }
    return Uint8Array.from(this.#bytes);
  }

  public destroy(): void {
    this.#bytes.fill(0);
    this.#destroyed = true;
  }

  public toJSON(): string {
    return "[REDACTED SECRET]";
  }
}

abstract class BoundedSecretString {
  readonly #value: string;

  protected constructor(value: unknown, label: string, maximum: number) {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > maximum ||
      !/^[A-Za-z0-9._:/-]+$/u.test(value)
    ) {
      throw new TypeError(`${label} must use the bounded opaque format.`);
    }
    this.#value = value;
  }

  protected value(): string {
    return this.#value;
  }
}

export class SecretPurpose extends BoundedSecretString {
  private constructor(value: unknown) {
    super(value, "Secret purpose", 100);
  }

  public static parse(value: unknown): SecretPurpose {
    return new SecretPurpose(value);
  }

  public identifier(): string {
    return this.value();
  }

  public toJSON(): string {
    return this.value();
  }
}

export class SecretReference extends BoundedSecretString {
  private constructor(value: unknown) {
    super(value, "Secret reference", 300);
  }

  public static parse(value: unknown): SecretReference {
    return new SecretReference(value);
  }

  public opaqueValue(): string {
    return this.value();
  }

  public toJSON(): string {
    return "[REDACTED SECRET REFERENCE]";
  }
}

export class SecretVersion {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): SecretVersion {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1) {
      throw new TypeError("Secret version must be a positive safe integer.");
    }
    return new SecretVersion(value);
  }

  public numberValue(): number {
    return this.#value;
  }

  public toJSON(): number {
    return this.#value;
  }
}

export interface SecretVersionMetadata {
  readonly createdAt: EpochMilliseconds;
  readonly disabledAt?: EpochMilliseconds;
  readonly reference: SecretReference;
  readonly replacedAt?: EpochMilliseconds;
  readonly rotatedFrom?: SecretVersion;
  readonly state: SecretVersionState;
  readonly version: SecretVersion;
}

export interface SecretMetadata {
  readonly currentVersion: SecretVersion;
  readonly createdAt: EpochMilliseconds;
  readonly disabledAt?: EpochMilliseconds;
  readonly lastRotatedAt?: EpochMilliseconds;
  readonly purpose: SecretPurpose;
  readonly reference: SecretReference;
}

export interface CreateSecretRequest {
  readonly material: SecretMaterial;
  readonly purpose: SecretPurpose;
}

export interface SecretVersionRequest {
  readonly reference: SecretReference;
  readonly version?: SecretVersion;
}

export interface ResolveSecretRequest extends SecretVersionRequest {
  readonly purpose: SecretPurpose;
}

export interface ResolvedSecret {
  readonly material: SecretMaterial;
  readonly metadata: SecretVersionMetadata;
}

export interface RotateSecretRequest {
  readonly expectedCurrentVersion: SecretVersion;
  readonly material: SecretMaterial;
  readonly reference: SecretReference;
}

export interface DisableSecretRequest {
  readonly expectedCurrentVersion: SecretVersion;
  readonly reference: SecretReference;
}

export interface SecretStorageProvider {
  create(request: CreateSecretRequest): Promise<SecretMetadata>;
  disable(request: DisableSecretRequest): Promise<SecretMetadata>;
  metadata(request: SecretVersionRequest): Promise<SecretVersionMetadata | undefined>;
  resolve(request: ResolveSecretRequest): Promise<ResolvedSecret>;
  rotate(request: RotateSecretRequest): Promise<SecretMetadata>;
}

export class SecretStorageError extends Error {
  public readonly code: SecretStorageErrorCode;
  public readonly operation: SecretStorageOperation;
  public readonly retryable: boolean;

  public constructor(operation: SecretStorageOperation, code: SecretStorageErrorCode) {
    super(`Secret storage ${operation} failed (${code}).`);
    this.name = "SecretStorageError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: SecretStorageErrorCode;
    operation: SecretStorageOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
