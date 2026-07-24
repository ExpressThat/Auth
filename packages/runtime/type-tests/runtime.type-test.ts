import {
  type AuthenticatedEncryptionProvider,
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  type CacheStateProvider,
  CacheValue,
  type Clock,
  EntityId,
  type IdentifierGenerator,
  KeyHandle,
  KeyLifecycleVersion,
  type KeyManagementService,
  KeyRingId,
  PasswordHash,
  type PasswordHasher,
  PublicEntityId,
  type RandomSource,
  SecretMaterial,
  SecretPurpose,
  SecretReference,
  type SecretStorageProvider,
  SecretVersion,
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
export const secretStorage: SecretStorageProvider = {
  create: async (request) => ({
    createdAt: deterministicClock.now(),
    currentVersion: SecretVersion.parse(1),
    purpose: request.purpose,
    reference: SecretReference.parse("test:secret/one"),
  }),
  disable: async () => ({
    createdAt: deterministicClock.now(),
    currentVersion: SecretVersion.parse(1),
    disabledAt: deterministicClock.now(),
    purpose: SecretPurpose.parse("test.secret"),
    reference: SecretReference.parse("test:secret/one"),
  }),
  metadata: async () => undefined,
  resolve: async () => {
    throw new Error("Type-only provider.");
  },
  rotate: async () => ({
    createdAt: deterministicClock.now(),
    currentVersion: SecretVersion.parse(2),
    lastRotatedAt: deterministicClock.now(),
    purpose: SecretPurpose.parse("test.secret"),
    reference: SecretReference.parse("test:secret/one"),
  }),
};
export const secretMaterial = SecretMaterial.fromBytes(new Uint8Array([1]));
export declare const keyManagement: KeyManagementService;
export const signingRing = KeyRingId.parse("issuer:ring/type-test");
export declare const cacheState: CacheStateProvider;
export const cacheScope = CacheScope.create({
  customerOrganisationId: PublicEntityId.parse("org", "org_01234567-89ab-7001-8203-040506070809"),
  environmentId: PublicEntityId.parse("env", "env_01234567-89ab-7001-8203-040506070809"),
  policyVersion: CachePolicyVersion.parse(1),
  purpose: CachePurpose.parse("type-test"),
});
export const cacheKey = CacheKey.create(cacheScope, "subject");

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
// @ts-expect-error -- secret creation requires a redacting SecretMaterial value.
secretStorage.create({ material: "raw", purpose: SecretPurpose.parse("test.secret") });
// @ts-expect-error -- cache operations require a scoped key, not a raw provider key.
cacheState.get({ failurePolicy: "deny-request", key: "tenant:subject" });
cacheState.put({
  expiresAt: deterministicClock.now(),
  // @ts-expect-error -- cache outage behavior must use an explicit supported policy.
  failurePolicy: "allow-request",
  key: cacheKey,
  value: CacheValue.fromBytes(new Uint8Array([1])),
});
keyManagement.rotate({
  // @ts-expect-error -- lifecycle algorithms are a closed allow-list.
  algorithm: "none",
  expectedRingVersion: KeyLifecycleVersion.parse(0),
  purpose: "issuer-signing",
  ringId: signingRing,
});
