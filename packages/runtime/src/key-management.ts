import type {
  KeyHandle,
  KeyPurpose,
  SigningAlgorithm,
  SigningKeyMetadata,
} from "./cryptography.js";
import type { SecretMaterial } from "./secret.js";
import type { EpochMilliseconds } from "./time.js";

export type KeyLifecycleState =
  | "active"
  | "compromised"
  | "creating"
  | "destroyed"
  | "retired"
  | "retiring"
  | "staged";
export type KeyManagementOperation =
  | "publish"
  | "retire"
  | "rotate"
  | "sign"
  | "unwrap"
  | "verify"
  | "wrap";
export type KeyManagementErrorCode =
  | "algorithm-mismatch"
  | "conflict"
  | "integrity-failure"
  | "invalid-state"
  | "not-found"
  | "purpose-mismatch"
  | "unavailable";

abstract class BoundedKeyString {
  readonly #value: string;

  protected constructor(value: unknown, label: string) {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > 200 ||
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

export class KeyRingId extends BoundedKeyString {
  private constructor(value: unknown) {
    super(value, "Key ring identifier");
  }

  public static parse(value: unknown): KeyRingId {
    return new KeyRingId(value);
  }

  public identifier(): string {
    return this.value();
  }
}

export class KeyLifecycleVersion {
  readonly #value: number;

  private constructor(value: number) {
    this.#value = value;
  }

  public static parse(value: unknown): KeyLifecycleVersion {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
      throw new TypeError("Key lifecycle version must be a non-negative safe integer.");
    }
    return new KeyLifecycleVersion(value);
  }

  public numberValue(): number {
    return this.#value;
  }

  public toJSON(): number {
    return this.#value;
  }
}

export type PublishedSigningJwk =
  | Readonly<{
      alg: "ES256";
      crv: "P-256";
      kid: string;
      kty: "EC";
      use: "sig";
      x: string;
      y: string;
    }>
  | Readonly<{
      alg: "RS256";
      e: string;
      kid: string;
      kty: "RSA";
      n: string;
      use: "sig";
    }>;

export interface ManagedSigningKeyMetadata {
  readonly activatedAt?: EpochMilliseconds;
  readonly algorithm: SigningAlgorithm;
  readonly createdAt: EpochMilliseconds;
  readonly handle: KeyHandle;
  readonly keyId: string;
  readonly publicKey: PublishedSigningJwk;
  readonly purpose: SigningKeyMetadata["purpose"];
  readonly retiredAt?: EpochMilliseconds;
  readonly retiringAt?: EpochMilliseconds;
  readonly ringId: KeyRingId;
  readonly state: KeyLifecycleState;
  readonly version: KeyLifecycleVersion;
}

export interface RotateSigningKeyRequest {
  readonly algorithm: SigningAlgorithm;
  readonly expectedRingVersion: KeyLifecycleVersion;
  readonly purpose: SigningKeyMetadata["purpose"];
  readonly ringId: KeyRingId;
}

export interface KeyRotationResult {
  readonly active: ManagedSigningKeyMetadata;
  readonly previous?: ManagedSigningKeyMetadata;
  readonly ringVersion: KeyLifecycleVersion;
}

export interface RetireSigningKeyRequest {
  readonly expectedRingVersion: KeyLifecycleVersion;
  readonly keyId: string;
  readonly ringId: KeyRingId;
}

export interface PublishedKeySet {
  readonly keys: readonly PublishedSigningJwk[];
  readonly ringId: KeyRingId;
  readonly ringVersion: KeyLifecycleVersion;
}

export interface ManagedSignRequest {
  readonly algorithm: SigningAlgorithm;
  readonly payload: Uint8Array;
  readonly purpose: SigningKeyMetadata["purpose"];
  readonly ringId: KeyRingId;
}

export interface ManagedVerifyRequest {
  readonly key: PublishedSigningJwk;
  readonly payload: Uint8Array;
  readonly signature: Uint8Array;
}

export interface WrapKeyRequest {
  readonly additionalData: Uint8Array;
  readonly material: SecretMaterial;
  readonly purpose: Extract<KeyPurpose, "credential-pepper" | "data-encryption">;
  readonly wrappingKeyHandle: KeyHandle;
  readonly wrappingKeyId: string;
}

export interface WrappedKey {
  readonly algorithm: "A256GCM";
  readonly ciphertext: Uint8Array;
  readonly nonce: Uint8Array;
  readonly wrappingKeyId: string;
}

export interface UnwrapKeyRequest {
  readonly additionalData: Uint8Array;
  readonly purpose: WrapKeyRequest["purpose"];
  readonly wrapped: WrappedKey;
  readonly wrappingKeyHandle: KeyHandle;
}

export interface KeyManagementService {
  publish(ringId: KeyRingId): Promise<PublishedKeySet>;
  retire(request: RetireSigningKeyRequest): Promise<ManagedSigningKeyMetadata>;
  rotate(request: RotateSigningKeyRequest): Promise<KeyRotationResult>;
  sign(request: ManagedSignRequest): Promise<Uint8Array>;
  unwrap(request: UnwrapKeyRequest): Promise<SecretMaterial>;
  verify(request: ManagedVerifyRequest): Promise<boolean>;
  wrap(request: WrapKeyRequest): Promise<WrappedKey>;
}

export class KeyManagementError extends Error {
  public readonly code: KeyManagementErrorCode;
  public readonly operation: KeyManagementOperation;
  public readonly retryable: boolean;

  public constructor(operation: KeyManagementOperation, code: KeyManagementErrorCode) {
    super(`Key management ${operation} failed (${code}).`);
    this.name = "KeyManagementError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: KeyManagementErrorCode;
    operation: KeyManagementOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
