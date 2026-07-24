import type { EpochMilliseconds } from "./time.js";

export type SigningAlgorithm = "ES256" | "RS256";
export type AuthenticatedEncryptionAlgorithm = "A256GCM";
export type KeyPurpose =
  | "cookie-encryption"
  | "credential-pepper"
  | "data-encryption"
  | "issuer-signing"
  | "webhook-signing";

export interface PortablePublicJsonWebKey {
  alg?: string;
  crv?: string;
  e?: string;
  ext?: boolean;
  key_ops?: string[];
  kty?: string;
  n?: string;
  use?: string;
  x?: string;
  y?: string;
}

export class KeyHandle {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): KeyHandle {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > 200 ||
      !/^[A-Za-z0-9._:/-]+$/u.test(value)
    ) {
      throw new TypeError("Key handle must use the bounded opaque handle format.");
    }
    return new KeyHandle(value);
  }

  public opaqueValue(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED KEY HANDLE]";
  }
}

export interface SigningKeyMetadata {
  readonly algorithm: SigningAlgorithm;
  readonly createdAt: EpochMilliseconds;
  readonly keyId: string;
  readonly publicJwk: PortablePublicJsonWebKey;
  readonly purpose: Extract<KeyPurpose, "issuer-signing" | "webhook-signing">;
}

export interface EncryptionKeyMetadata {
  readonly algorithm: AuthenticatedEncryptionAlgorithm;
  readonly createdAt: EpochMilliseconds;
  readonly keyId: string;
  readonly purpose: Extract<KeyPurpose, "cookie-encryption" | "data-encryption">;
}

export interface SignBytesRequest {
  readonly algorithm: SigningAlgorithm;
  readonly keyHandle: KeyHandle;
  readonly keyId: string;
  readonly payload: Uint8Array;
  readonly purpose: SigningKeyMetadata["purpose"];
}

export interface VerifyBytesRequest {
  readonly key: SigningKeyMetadata;
  readonly payload: Uint8Array;
  readonly signature: Uint8Array;
}

export interface SigningProvider {
  sign(request: SignBytesRequest): Promise<Uint8Array>;
  verify(request: VerifyBytesRequest): Promise<boolean>;
}

export interface EncryptBytesRequest {
  readonly additionalData: Uint8Array;
  readonly algorithm: AuthenticatedEncryptionAlgorithm;
  readonly keyHandle: KeyHandle;
  readonly keyId: string;
  readonly plaintext: Uint8Array;
  readonly purpose: EncryptionKeyMetadata["purpose"];
}

export interface EncryptedBytes {
  readonly algorithm: AuthenticatedEncryptionAlgorithm;
  readonly ciphertext: Uint8Array;
  readonly keyId: string;
  readonly nonce: Uint8Array;
}

export interface DecryptBytesRequest {
  readonly additionalData: Uint8Array;
  readonly encrypted: EncryptedBytes;
  readonly keyHandle: KeyHandle;
  readonly purpose: EncryptionKeyMetadata["purpose"];
}

export interface AuthenticatedEncryptionProvider {
  decrypt(request: DecryptBytesRequest): Promise<Uint8Array>;
  encrypt(request: EncryptBytesRequest): Promise<EncryptedBytes>;
}
