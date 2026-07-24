import {
  AdapterIdentifier,
  type AuthenticatedEncryptionProvider,
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  type CacheStateProvider,
  CacheValue,
  type Clock,
  CustomerOrganisationId,
  composeRuntimeDependencies,
  type DurableQueueProvider,
  EntityId,
  type FoundationalRuntimeDependencies,
  type IdentifierGenerator,
  KeyHandle,
  KeyLifecycleVersion,
  type KeyManagementService,
  KeyRingId,
  ManagementOrganisationId,
  ObjectKey,
  ObjectScope,
  type ObjectStorageProvider,
  type ObservabilityProvider,
  PasswordHash,
  type PasswordHasher,
  PublicEntityId,
  QueueScope,
  type RandomSource,
  RuntimeCapability,
  RuntimeCapabilityManifest,
  type RuntimeDependencyCompositionInput,
  SchemaDigest,
  SchemaIdentifier,
  SchemaVersion,
  SecretMaterial,
  SecretPurpose,
  SecretReference,
  type SecretStorageProvider,
  SecretVersion,
  SemanticVersion,
  ServicePrincipalId,
  type SigningProvider,
  type StatefulRuntimeDependencies,
  SystemClock,
  TELEMETRY_FIELDS,
  TelemetryAttribute,
  UuidV7Generator,
  WebCryptoRandomSource,
} from "@expressthat-auth/runtime";
import {
  ControlledClock,
  createTestRuntimeCapabilityComposition,
  SequenceRandomSource,
  TestCacheStateAdapter,
} from "@expressthat-auth/runtime/testing";

type ProductionRuntime = typeof import("@expressthat-auth/runtime");
// @ts-expect-error -- testing adapters are absent from the production root export.
export type InvalidProductionTestAdapter = ProductionRuntime["TestCacheStateAdapter"];

export const clock: Clock = new SystemClock();
export const deterministicClock: Clock = new ControlledClock(0);
export const testCacheState = new TestCacheStateAdapter(deterministicClock);
export const testCapabilityComposition = createTestRuntimeCapabilityComposition();
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
export declare const durableQueue: DurableQueueProvider;
export const queueScope = QueueScope.create({
  customerOrganisationId: PublicEntityId.parse("org", "org_01234567-89ab-7001-8203-040506070809"),
  environmentId: PublicEntityId.parse("env", "env_01234567-89ab-7001-8203-040506070809"),
});
export declare const objectStorage: ObjectStorageProvider;
export const objectScope = ObjectScope.create({
  customerOrganisationId: PublicEntityId.parse("org", "org_01234567-89ab-7001-8203-040506070809"),
  environmentId: PublicEntityId.parse("env", "env_01234567-89ab-7001-8203-040506070809"),
});
export const objectKey = ObjectKey.parse("type-test/object");
export declare const observability: ObservabilityProvider;
export const customerOrganisationId = CustomerOrganisationId.fromPublicId(
  PublicEntityId.parse("org", "org_01234567-89ab-7001-8203-040506070809"),
);
export const managementOrganisationId = ManagementOrganisationId.fromPublicId(
  PublicEntityId.parse("org", "org_01234567-89ab-7001-8203-040506070809"),
);
export const workerServiceId = ServicePrincipalId.parse("platform/jobs.worker");
export const capability = RuntimeCapability.parse("infrastructure/durable-queue");
export const adapterManifest = RuntimeCapabilityManifest.create({
  adapter: AdapterIdentifier.parse("reference/durable-queue"),
  adapterVersion: SemanticVersion.parse("1.0.0"),
  capabilities: [
    {
      capability,
      failureBehavior: "reject-operation",
      healthBehavior: "startup-and-readiness",
      residency: "operator-defined",
      state: { coordination: "shared", durability: "durable", kind: "stateful" },
    },
  ],
  configurationSchema: {
    digest: SchemaDigest.parse("1".repeat(64)),
    identifier: SchemaIdentifier.parse("durable-queue.config"),
    version: SchemaVersion.parse(1),
  },
  contractVersion: SchemaVersion.parse(1),
  node: { maximumMajorExclusive: 27, minimumMajor: 24, runtime: "node" },
  profiles: ["self-hosted"],
});
export declare const runtimeCompositionInput: RuntimeDependencyCompositionInput;
export const runtimeDependencies = composeRuntimeDependencies(runtimeCompositionInput);
export const foundationalDependencies: FoundationalRuntimeDependencies = runtimeDependencies;

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
// @ts-expect-error -- acknowledgements require a typed lease receipt.
durableQueue.acknowledge({ receipt: "job:lease" });
// @ts-expect-error -- object lookups require a validated, redacting key.
objectStorage.get({ key: "exports/file", scope: objectScope });
TelemetryAttribute.create(
  TELEMETRY_FIELDS.operation,
  // @ts-expect-error -- raw strings cannot enter registered telemetry fields.
  "canary-secret-value",
);
// @ts-expect-error -- management and customer organisation brands are distinct.
export const wrongOrganisationBrand: CustomerOrganisationId = managementOrganisationId;
// @ts-expect-error -- narrow foundational dependencies do not expose durable state.
export const invalidStatefulDependencies: StatefulRuntimeDependencies = foundationalDependencies;
RuntimeCapabilityManifest.create({
  adapter: adapterManifest.adapter,
  adapterVersion: adapterManifest.adapterVersion,
  capabilities: [
    {
      // @ts-expect-error -- manifest capabilities cannot be caller-provided strings.
      capability: "infrastructure/durable-queue",
      failureBehavior: "reject-operation",
      healthBehavior: "startup-and-readiness",
      residency: "operator-defined",
      state: { kind: "stateless" },
    },
  ],
  configurationSchema: adapterManifest.configurationSchema,
  contractVersion: adapterManifest.contractVersion,
  node: adapterManifest.node,
  profiles: adapterManifest.profiles,
});
keyManagement.rotate({
  // @ts-expect-error -- lifecycle algorithms are a closed allow-list.
  algorithm: "none",
  expectedRingVersion: KeyLifecycleVersion.parse(0),
  purpose: "issuer-signing",
  ringId: signingRing,
});
