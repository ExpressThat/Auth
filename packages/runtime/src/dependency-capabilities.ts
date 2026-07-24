import { RuntimeCapability } from "./capability-values.js";

export const RUNTIME_DEPENDENCY_CAPABILITIES = Object.freeze({
  authenticatedEncryption: RuntimeCapability.parse("security/authenticated-encryption"),
  cacheState: RuntimeCapability.parse("infrastructure/cache-state"),
  certificateAutomation: RuntimeCapability.parse("infrastructure/certificate-automation"),
  dnsAutomation: RuntimeCapability.parse("infrastructure/dns-automation"),
  durableQueue: RuntimeCapability.parse("infrastructure/durable-queue"),
  frontendDeployment: RuntimeCapability.parse("infrastructure/deployment-automation"),
  keyManagement: RuntimeCapability.parse("security/key-management"),
  objectStorage: RuntimeCapability.parse("infrastructure/object-storage"),
  observability: RuntimeCapability.parse("infrastructure/observability"),
  passwordHashing: RuntimeCapability.parse("security/password-hashing"),
  secretStorage: RuntimeCapability.parse("infrastructure/secret-storage"),
  signing: RuntimeCapability.parse("security/signing"),
});
