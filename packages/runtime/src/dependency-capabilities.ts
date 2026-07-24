import { RuntimeCapability } from "./capability-values.js";

export const RUNTIME_DEPENDENCY_CAPABILITIES = Object.freeze({
  authenticatedEncryption: RuntimeCapability.parse("security/authenticated-encryption"),
  cacheState: RuntimeCapability.parse("infrastructure/cache-state"),
  durableQueue: RuntimeCapability.parse("infrastructure/durable-queue"),
  keyManagement: RuntimeCapability.parse("security/key-management"),
  objectStorage: RuntimeCapability.parse("infrastructure/object-storage"),
  observability: RuntimeCapability.parse("infrastructure/observability"),
  passwordHashing: RuntimeCapability.parse("security/password-hashing"),
  secretStorage: RuntimeCapability.parse("infrastructure/secret-storage"),
  signing: RuntimeCapability.parse("security/signing"),
});
