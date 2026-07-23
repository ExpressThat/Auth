import { argon2idAsync } from "@noble/hashes/argon2.js";
import { formatArgon2Hash, parseApprovedArgon2Hash } from "./phc.ts";
import { ARGON2_POLICY, passwordBytes } from "./policy.ts";

function derive(password: string, salt: Uint8Array): Promise<Uint8Array> {
  return argon2idAsync(passwordBytes(password), salt, {
    t: ARGON2_POLICY.iterations,
    m: ARGON2_POLICY.memoryKiB,
    p: ARGON2_POLICY.parallelism,
    version: ARGON2_POLICY.version,
    dkLen: ARGON2_POLICY.hashBytes,
    maxmem: 32 * 1024 * 1024,
    asyncTick: 10,
  });
}

function equalHashBytes(left: Uint8Array, right: Uint8Array): boolean {
  let difference = 0;

  for (let index = 0; index < ARGON2_POLICY.hashBytes; index += 1) {
    difference |= left[index]! ^ right[index]!;
  }

  return difference === 0;
}

export async function portableHash(
  password: string,
  salt: Uint8Array,
): Promise<string> {
  if (salt.length !== ARGON2_POLICY.saltBytes) {
    throw new RangeError("Argon2id salts must contain exactly 16 bytes.");
  }

  return formatArgon2Hash(salt, await derive(password, salt));
}

export async function portableVerify(
  encodedHash: string,
  password: string,
): Promise<boolean> {
  const parsed = parseApprovedArgon2Hash(encodedHash);

  if (!parsed) {
    return false;
  }

  const actual = await derive(password, parsed.salt);

  return equalHashBytes(actual, parsed.hash);
}
