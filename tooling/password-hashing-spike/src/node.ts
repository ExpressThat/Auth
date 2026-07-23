import { hash, verify } from "@node-rs/argon2";
import { ARGON2_POLICY, passwordBytes } from "./policy.ts";

// @node-rs/argon2 publishes Argon2id as ambient const-enum value 2.
const NODE_ARGON2ID = 2 as const;

export async function nodeHash(password: string): Promise<string> {
  return hash(passwordBytes(password), {
    algorithm: NODE_ARGON2ID,
    memoryCost: ARGON2_POLICY.memoryKiB,
    timeCost: ARGON2_POLICY.iterations,
    parallelism: ARGON2_POLICY.parallelism,
    outputLen: ARGON2_POLICY.hashBytes,
  });
}

export async function nodeVerify(
  encodedHash: string,
  password: string,
): Promise<boolean> {
  return verify(encodedHash, passwordBytes(password));
}
