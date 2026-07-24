export const MAX_RANDOM_BYTES = 65_536;

function validateLength(length: number): void {
  if (!Number.isSafeInteger(length) || length < 1 || length > MAX_RANDOM_BYTES) {
    throw new RangeError("Random byte length must be an integer from 1 through 65536.");
  }
}

export interface RandomSource {
  bytes(length: number): Uint8Array;
}

export class WebCryptoRandomSource implements RandomSource {
  public bytes(length: number): Uint8Array {
    validateLength(length);
    return globalThis.crypto.getRandomValues(new Uint8Array(length));
  }
}

export function requireRandomByteLength(length: number): void {
  validateLength(length);
}
