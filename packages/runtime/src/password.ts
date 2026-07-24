export const MAX_STORED_PASSWORD_HASH_BYTES = 2_048;

export class PasswordHash {
  readonly #encoded: string;

  private constructor(encoded: string) {
    this.#encoded = encoded;
  }

  public static fromStorage(value: unknown): PasswordHash {
    if (
      typeof value !== "string" ||
      value.length === 0 ||
      new TextEncoder().encode(value).length > MAX_STORED_PASSWORD_HASH_BYTES
    ) {
      throw new TypeError("Stored password hash must be a bounded non-empty string.");
    }
    return new PasswordHash(value);
  }

  public encodedForStorage(): string {
    return this.#encoded;
  }

  public toJSON(): string {
    return "[REDACTED PASSWORD HASH]";
  }
}

export interface PasswordHasherMetadata {
  readonly adapterId: string;
  readonly algorithm: "argon2id";
  readonly policyId: string;
}

export interface PasswordVerification {
  readonly rehashRequired: boolean;
  readonly valid: boolean;
}

export interface PasswordHasher {
  readonly metadata: PasswordHasherMetadata;
  hash(password: string): Promise<PasswordHash>;
  verify(hash: PasswordHash, password: string): Promise<PasswordVerification>;
}
