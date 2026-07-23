export const ARGON2_POLICY = {
  algorithm: "argon2id",
  version: 19,
  memoryKiB: 19_456,
  iterations: 2,
  parallelism: 1,
  saltBytes: 16,
  hashBytes: 32,
} as const;

export const MAX_PASSWORD_BYTES = 1_024;

export function passwordBytes(password: string): Uint8Array {
  const encoded = new TextEncoder().encode(password);

  if (encoded.length > MAX_PASSWORD_BYTES) {
    throw new RangeError("Password exceeds the hashing input limit.");
  }

  return encoded;
}
