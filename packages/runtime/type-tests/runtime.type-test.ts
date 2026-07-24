import {
  type AuthenticatedEncryptionProvider,
  type Clock,
  EntityId,
  type IdentifierGenerator,
  KeyHandle,
  PasswordHash,
  type PasswordHasher,
  PublicEntityId,
  type RandomSource,
  type SigningProvider,
  SystemClock,
  UuidV7Generator,
  WebCryptoRandomSource,
} from "@expressthat-auth/runtime";
import { ControlledClock, SequenceRandomSource } from "@expressthat-auth/runtime/testing";

export const clock: Clock = new SystemClock();
export const deterministicClock: Clock = new ControlledClock(0);
export const random: RandomSource = new WebCryptoRandomSource();
export const deterministicRandom: RandomSource = new SequenceRandomSource([new Uint8Array(10)]);
export const identifierGenerator: IdentifierGenerator = new UuidV7Generator(
  deterministicClock,
  deterministicRandom,
);
export const userId: PublicEntityId<"usr"> = PublicEntityId.create(
  "usr",
  EntityId.parse("01234567-89ab-7001-8203-040506070809"),
);
export const passwordHasher: PasswordHasher = {
  hash: async () => PasswordHash.fromStorage("synthetic"),
  metadata: { adapterId: "test", algorithm: "argon2id", policyId: "test" },
  verify: async () => ({ rehashRequired: false, valid: true }),
};
export const signingProvider: SigningProvider = {
  sign: async () => new Uint8Array(),
  verify: async () => true,
};
export const encryptionProvider: AuthenticatedEncryptionProvider = {
  decrypt: async () => new Uint8Array(),
  encrypt: async (request) => ({
    algorithm: request.algorithm,
    ciphertext: new Uint8Array(),
    keyId: request.keyId,
    nonce: new Uint8Array(12),
  }),
};
export const keyHandle: KeyHandle = KeyHandle.parse("test:key");

// @ts-expect-error -- public identifier prefixes come from the fixed registry.
PublicEntityId.parse("account", "account_01234567-89ab-7001-8203-040506070809");
// @ts-expect-error -- clocks return validated epoch-millisecond values.
export const invalidClock: Clock = { now: () => 1 };
// @ts-expect-error -- random sources return byte arrays.
export const invalidRandom: RandomSource = { bytes: () => "random" };
// @ts-expect-error -- a user-prefixed identifier is not an application identifier.
export const applicationId: PublicEntityId<"app"> = userId;
// @ts-expect-error -- unsupported signing algorithms cannot enter the provider contract.
signingProvider.sign({ algorithm: "none" });
// @ts-expect-error -- password hash values cannot be substituted with raw strings.
passwordHasher.verify("encoded", "password");
