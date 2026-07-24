import { hash, verify } from "@node-rs/argon2";
import { parseApprovedArgon2Hash } from "./phc.ts";
import { ARGON2_POLICY, passwordBytes } from "./policy.ts";

// @node-rs/argon2 publishes Argon2id as ambient const-enum value 2.
const NODE_ARGON2ID = 2 as const;

export async function nodeHash(password: string, salt: Uint8Array): Promise<string> {
  if (salt.length !== ARGON2_POLICY.saltBytes) {
    throw new RangeError("Argon2id salts must contain exactly 16 bytes.");
  }
  return hash(passwordBytes(password), {
    algorithm: NODE_ARGON2ID,
    memoryCost: ARGON2_POLICY.memoryKiB,
    timeCost: ARGON2_POLICY.iterations,
    parallelism: ARGON2_POLICY.parallelism,
    outputLen: ARGON2_POLICY.hashBytes,
    salt,
  });
}

export async function nodeVerify(encodedHash: string, password: string): Promise<boolean> {
  if (parseApprovedArgon2Hash(encodedHash) === undefined) {
    return false;
  }
  return verify(encodedHash, passwordBytes(password));
}
