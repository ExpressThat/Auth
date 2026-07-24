import type {
  AuthenticatedEncryptionProvider,
  DecryptBytesRequest,
  EncryptBytesRequest,
  EncryptedBytes,
  EncryptionKeyMetadata,
  SignBytesRequest,
  SigningKeyMetadata,
  SigningProvider,
  VerifyBytesRequest,
} from "../index.js";

type SigningFixture = {
  readonly handle: string;
  readonly metadata: SigningKeyMetadata;
  readonly privateKey: CryptoKey;
};

type EncryptionFixture = {
  readonly handle: string;
  readonly key: CryptoKey;
  readonly metadata: EncryptionKeyMetadata;
  readonly nonce: Uint8Array;
};

function webBytes(value: Uint8Array): Uint8Array<ArrayBuffer> {
  const copy = new Uint8Array(value.length);
  copy.set(value);
  return copy;
}

function requireMatch(
  actual: Readonly<{ algorithm: string; keyId: string; purpose: string }>,
  expected: Readonly<{ algorithm: string; keyId: string; purpose: string }>,
  handle: string,
  expectedHandle: string,
): void {
  if (
    actual.algorithm !== expected.algorithm ||
    actual.keyId !== expected.keyId ||
    actual.purpose !== expected.purpose ||
    handle !== expectedHandle
  ) {
    throw new Error("Cryptographic key metadata or purpose does not match.");
  }
}

export class TestWebCryptoAdapter implements SigningProvider, AuthenticatedEncryptionProvider {
  readonly #encryption: EncryptionFixture;
  readonly #signing: SigningFixture;

  public constructor(signing: SigningFixture, encryption: EncryptionFixture) {
    this.#signing = signing;
    this.#encryption = encryption;
  }

  public async sign(request: SignBytesRequest): Promise<Uint8Array> {
    requireMatch(
      request,
      this.#signing.metadata,
      request.keyHandle.opaqueValue(),
      this.#signing.handle,
    );
    const parameters =
      request.algorithm === "RS256"
        ? { name: "RSASSA-PKCS1-v1_5" }
        : { hash: "SHA-256", name: "ECDSA" };
    const signature = await crypto.subtle.sign(
      parameters,
      this.#signing.privateKey,
      webBytes(request.payload),
    );
    return new Uint8Array(signature);
  }

  public async verify(request: VerifyBytesRequest): Promise<boolean> {
    if (
      request.key.algorithm !== this.#signing.metadata.algorithm ||
      request.key.keyId !== this.#signing.metadata.keyId ||
      request.key.purpose !== this.#signing.metadata.purpose
    ) {
      return false;
    }
    const importParameters =
      request.key.algorithm === "RS256"
        ? { hash: "SHA-256", name: "RSASSA-PKCS1-v1_5" }
        : { name: "ECDSA", namedCurve: "P-256" };
    const verificationParameters =
      request.key.algorithm === "RS256"
        ? { name: "RSASSA-PKCS1-v1_5" }
        : { hash: "SHA-256", name: "ECDSA" };
    const publicKey = await crypto.subtle.importKey(
      "jwk",
      request.key.publicJwk,
      importParameters,
      false,
      ["verify"],
    );
    return crypto.subtle.verify(
      verificationParameters,
      publicKey,
      webBytes(request.signature),
      webBytes(request.payload),
    );
  }

  public signingMetadata(): SigningKeyMetadata {
    return this.#signing.metadata;
  }

  public async encrypt(request: EncryptBytesRequest): Promise<EncryptedBytes> {
    requireMatch(
      request,
      this.#encryption.metadata,
      request.keyHandle.opaqueValue(),
      this.#encryption.handle,
    );
    const ciphertext = await crypto.subtle.encrypt(
      {
        additionalData: webBytes(request.additionalData),
        iv: webBytes(this.#encryption.nonce),
        name: "AES-GCM",
        tagLength: 128,
      },
      this.#encryption.key,
      webBytes(request.plaintext),
    );
    return {
      algorithm: "A256GCM",
      ciphertext: new Uint8Array(ciphertext),
      keyId: request.keyId,
      nonce: Uint8Array.from(this.#encryption.nonce),
    };
  }

  public async decrypt(request: DecryptBytesRequest): Promise<Uint8Array> {
    requireMatch(
      {
        algorithm: request.encrypted.algorithm,
        keyId: request.encrypted.keyId,
        purpose: request.purpose,
      },
      this.#encryption.metadata,
      request.keyHandle.opaqueValue(),
      this.#encryption.handle,
    );
    const plaintext = await crypto.subtle.decrypt(
      {
        additionalData: webBytes(request.additionalData),
        iv: webBytes(request.encrypted.nonce),
        name: "AES-GCM",
        tagLength: 128,
      },
      this.#encryption.key,
      webBytes(request.encrypted.ciphertext),
    );
    return new Uint8Array(plaintext);
  }
}
