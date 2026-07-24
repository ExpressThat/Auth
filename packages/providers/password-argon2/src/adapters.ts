import {
  PasswordHash,
  type PasswordHasher,
  type PasswordHasherMetadata,
  type PasswordVerification,
  type RandomSource,
} from "@expressthat-auth/runtime";
import { nodeHash, nodeVerify } from "./node.ts";
import { portableHash, portableVerify } from "./portable.ts";

const POLICY_ID = "argon2id-v19-m19456-t2-p1-s16-h32";

function metadata(adapterId: string): PasswordHasherMetadata {
  return {
    adapterId,
    algorithm: "argon2id",
    policyId: POLICY_ID,
  };
}

abstract class Argon2PasswordHasher implements PasswordHasher {
  readonly #random: RandomSource;
  public abstract readonly metadata: PasswordHasherMetadata;

  public constructor(random: RandomSource) {
    this.#random = random;
  }

  protected salt(): Uint8Array {
    return this.#random.bytes(16);
  }

  public abstract hash(password: string): Promise<PasswordHash>;
  public abstract verify(hash: PasswordHash, password: string): Promise<PasswordVerification>;
}

export class NodeArgon2PasswordHasher extends Argon2PasswordHasher {
  public readonly metadata = metadata("node-rs-argon2");

  public async hash(password: string): Promise<PasswordHash> {
    return PasswordHash.fromStorage(await nodeHash(password, this.salt()));
  }

  public async verify(hash: PasswordHash, password: string): Promise<PasswordVerification> {
    return {
      rehashRequired: false,
      valid: await nodeVerify(hash.encodedForStorage(), password),
    };
  }
}

export class PortableArgon2PasswordHasher extends Argon2PasswordHasher {
  public readonly metadata = metadata("noble-hashes-argon2id");

  public async hash(password: string): Promise<PasswordHash> {
    return PasswordHash.fromStorage(await portableHash(password, this.salt()));
  }

  public async verify(hash: PasswordHash, password: string): Promise<PasswordVerification> {
    return {
      rehashRequired: false,
      valid: await portableVerify(hash.encodedForStorage(), password),
    };
  }
}
