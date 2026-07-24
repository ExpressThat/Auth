import { ARGON2_POLICY } from "./policy.ts";

const PHC_PATTERN =
  /^\$argon2id\$v=(\d+)\$m=(\d+),t=(\d+),p=(\d+)\$([A-Za-z0-9+/]+)\$([A-Za-z0-9+/]+)$/;

export type ParsedArgon2Hash = {
  hash: Uint8Array;
  salt: Uint8Array;
};

function encodeBase64(bytes: Uint8Array): string {
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replace(/=+$/u, "");
}

function decodeBase64(value: string): Uint8Array {
  const padded = value.padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);

  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

export function formatArgon2Hash(salt: Uint8Array, hash: Uint8Array): string {
  return [
    "$argon2id",
    `v=${ARGON2_POLICY.version}`,
    `m=${ARGON2_POLICY.memoryKiB},t=${ARGON2_POLICY.iterations},p=${ARGON2_POLICY.parallelism}`,
    encodeBase64(salt),
    encodeBase64(hash),
  ].join("$");
}

export function parseApprovedArgon2Hash(encodedHash: string): ParsedArgon2Hash | undefined {
  const match = PHC_PATTERN.exec(encodedHash);
  const saltValue = match?.[5];
  const hashValue = match?.[6];

  if (
    !match ||
    !saltValue ||
    !hashValue ||
    Number(match[1]) !== ARGON2_POLICY.version ||
    Number(match[2]) !== ARGON2_POLICY.memoryKiB ||
    Number(match[3]) !== ARGON2_POLICY.iterations ||
    Number(match[4]) !== ARGON2_POLICY.parallelism
  ) {
    return undefined;
  }

  try {
    const salt = decodeBase64(saltValue);
    const hash = decodeBase64(hashValue);

    if (salt.length !== ARGON2_POLICY.saltBytes || hash.length !== ARGON2_POLICY.hashBytes) {
      return undefined;
    }

    return { salt, hash };
  } catch {
    return undefined;
  }
}
