import type {
  Clock,
  KeyManagementService,
  KeyRotationResult,
  ManagedSigningKeyMetadata,
  ManagedSignRequest,
  ManagedVerifyRequest,
  PublishedKeySet,
  RandomSource,
  RetireSigningKeyRequest,
  RotateSigningKeyRequest,
  UnwrapKeyRequest,
  WrapKeyRequest,
  WrappedKey,
} from "../src/index.js";
import {
  KeyHandle,
  KeyLifecycleVersion,
  KeyManagementError,
  SecretMaterial,
} from "../src/index.js";
import {
  cryptoBytes,
  generateSigningKey,
  type SigningKeyPair,
  signBytes,
  verifyBytes,
} from "./key-test-crypto.js";

type MutableKey = {
  metadata: {
    activatedAt?: ManagedSigningKeyMetadata["activatedAt"];
    algorithm: ManagedSigningKeyMetadata["algorithm"];
    createdAt: ManagedSigningKeyMetadata["createdAt"];
    handle: ManagedSigningKeyMetadata["handle"];
    keyId: string;
    publicKey: ManagedSigningKeyMetadata["publicKey"];
    purpose: ManagedSigningKeyMetadata["purpose"];
    retiredAt?: ManagedSigningKeyMetadata["retiredAt"];
    retiringAt?: ManagedSigningKeyMetadata["retiringAt"];
    ringId: ManagedSigningKeyMetadata["ringId"];
    state: ManagedSigningKeyMetadata["state"];
    version: ManagedSigningKeyMetadata["version"];
  };
  pair: SigningKeyPair;
};

type Ring = { keys: MutableKey[]; version: number };
type WrappingFixture = {
  handle: string;
  key: CryptoKey;
  keyId: string;
  purpose: WrapKeyRequest["purpose"];
};

function copyMetadata(key: MutableKey): ManagedSigningKeyMetadata {
  const metadata = key.metadata;
  return {
    algorithm: metadata.algorithm,
    createdAt: metadata.createdAt,
    handle: metadata.handle,
    keyId: metadata.keyId,
    publicKey: { ...metadata.publicKey },
    purpose: metadata.purpose,
    ringId: metadata.ringId,
    state: metadata.state,
    version: metadata.version,
    ...(metadata.activatedAt === undefined ? {} : { activatedAt: metadata.activatedAt }),
    ...(metadata.retiredAt === undefined ? {} : { retiredAt: metadata.retiredAt }),
    ...(metadata.retiringAt === undefined ? {} : { retiringAt: metadata.retiringAt }),
  };
}

export class TestKeyManagementAdapter implements KeyManagementService {
  readonly #clock: Clock;
  readonly #random: RandomSource;
  readonly #rings = new Map<string, Ring>();
  readonly #wrapping: WrappingFixture;

  public constructor(clock: Clock, random: RandomSource, wrapping: WrappingFixture) {
    this.#clock = clock;
    this.#random = random;
    this.#wrapping = wrapping;
  }

  public async publish(ringId: RotateSigningKeyRequest["ringId"]): Promise<PublishedKeySet> {
    const ring = this.#ring(ringId, "publish");
    return {
      keys: ring.keys
        .filter((key) => ["active", "retiring", "staged"].includes(key.metadata.state))
        .map((key) => ({ ...key.metadata.publicKey })),
      ringId,
      ringVersion: KeyLifecycleVersion.parse(ring.version),
    };
  }

  public async retire(request: RetireSigningKeyRequest): Promise<ManagedSigningKeyMetadata> {
    const ring = this.#ring(request.ringId, "retire");
    this.#expected(ring, request.expectedRingVersion, "retire");
    const key = ring.keys.find((candidate) => candidate.metadata.keyId === request.keyId);

    if (!key) {
      throw new KeyManagementError("retire", "not-found");
    }
    if (key.metadata.state !== "retiring") {
      throw new KeyManagementError("retire", "invalid-state");
    }
    ring.version += 1;
    key.metadata.retiredAt = this.#clock.now();
    key.metadata.state = "retired";
    key.metadata.version = KeyLifecycleVersion.parse(ring.version);
    return copyMetadata(key);
  }

  public async rotate(request: RotateSigningKeyRequest): Promise<KeyRotationResult> {
    const ringKey = request.ringId.identifier();
    const ring = this.#rings.get(ringKey) ?? { keys: [], version: 0 };
    this.#expected(ring, request.expectedRingVersion, "rotate");
    const pair = await generateSigningKey(request.algorithm);
    const now = this.#clock.now();
    const active = ring.keys.find((key) => key.metadata.state === "active");
    ring.version += 1;
    const version = KeyLifecycleVersion.parse(ring.version);

    if (active) {
      active.metadata.retiringAt = now;
      active.metadata.state = "retiring";
      active.metadata.version = version;
    }
    const created: MutableKey = {
      metadata: {
        activatedAt: now,
        algorithm: request.algorithm,
        createdAt: now,
        handle: KeyHandle.parse(`test:key/${pair.publicKey.kid}`),
        keyId: pair.publicKey.kid,
        publicKey: pair.publicKey,
        purpose: request.purpose,
        ringId: request.ringId,
        state: "active",
        version,
      },
      pair,
    };
    ring.keys.push(created);
    this.#rings.set(ringKey, ring);
    return {
      active: copyMetadata(created),
      ...(active ? { previous: copyMetadata(active) } : {}),
      ringVersion: version,
    };
  }

  public async sign(request: ManagedSignRequest): Promise<Uint8Array> {
    const ring = this.#ring(request.ringId, "sign");
    const active = ring.keys.find((key) => key.metadata.state === "active");

    if (!active) {
      throw new KeyManagementError("sign", "invalid-state");
    }
    if (active.metadata.algorithm !== request.algorithm) {
      throw new KeyManagementError("sign", "algorithm-mismatch");
    }
    if (active.metadata.purpose !== request.purpose) {
      throw new KeyManagementError("sign", "purpose-mismatch");
    }
    return signBytes(active.pair, request.payload);
  }

  public async verify(request: ManagedVerifyRequest): Promise<boolean> {
    return verifyBytes(request.key, request.payload, request.signature);
  }

  public async wrap(request: WrapKeyRequest): Promise<WrappedKey> {
    this.#requireWrapping(request, request.wrappingKeyId, "wrap");
    const nonce = this.#random.bytes(12);
    const ciphertext = await crypto.subtle.encrypt(
      {
        additionalData: cryptoBytes(request.additionalData),
        iv: cryptoBytes(nonce),
        name: "AES-GCM",
        tagLength: 128,
      },
      this.#wrapping.key,
      cryptoBytes(request.material.copyForProvider()),
    );
    return {
      algorithm: "A256GCM",
      ciphertext: new Uint8Array(ciphertext),
      nonce: Uint8Array.from(nonce),
      wrappingKeyId: request.wrappingKeyId,
    };
  }

  public async unwrap(request: UnwrapKeyRequest): Promise<SecretMaterial> {
    this.#requireWrapping(request, request.wrapped.wrappingKeyId, "unwrap");
    try {
      const material = await crypto.subtle.decrypt(
        {
          additionalData: cryptoBytes(request.additionalData),
          iv: cryptoBytes(request.wrapped.nonce),
          name: "AES-GCM",
          tagLength: 128,
        },
        this.#wrapping.key,
        cryptoBytes(request.wrapped.ciphertext),
      );
      return SecretMaterial.fromBytes(new Uint8Array(material));
    } catch {
      throw new KeyManagementError("unwrap", "integrity-failure");
    }
  }

  #expected(ring: Ring, expected: KeyLifecycleVersion, operation: "retire" | "rotate"): void {
    if (ring.version !== expected.numberValue()) {
      throw new KeyManagementError(operation, "conflict");
    }
  }

  #requireWrapping(
    request: Readonly<{ purpose: string; wrappingKeyHandle: KeyHandle }>,
    keyId: string,
    operation: "unwrap" | "wrap",
  ): void {
    if (
      request.wrappingKeyHandle.opaqueValue() !== this.#wrapping.handle ||
      keyId !== this.#wrapping.keyId ||
      request.purpose !== this.#wrapping.purpose
    ) {
      throw new KeyManagementError(operation, "purpose-mismatch");
    }
  }

  #ring(ringId: RotateSigningKeyRequest["ringId"], operation: "publish" | "retire" | "sign"): Ring {
    const ring = this.#rings.get(ringId.identifier());
    if (!ring) {
      throw new KeyManagementError(operation, "not-found");
    }
    return ring;
  }
}
