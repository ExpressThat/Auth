import type { CacheStateProvider } from "./cache.js";
import type { RuntimeCapabilityManifest } from "./capability-manifest.js";
import type { ValidatedCapabilityComposition } from "./capability-validation.js";
import type { CertificateAutomationProvider } from "./certificate-automation.js";
import type { AuthenticatedEncryptionProvider, SigningProvider } from "./cryptography.js";
import type { FrontendDeploymentProvider } from "./deployment-automation.js";
import type { DnsAutomationProvider } from "./dns-automation.js";
import type { IdentifierGenerator } from "./identifier.js";
import type { KeyManagementService } from "./key-management.js";
import type { ObjectStorageProvider } from "./object-storage.js";
import type { ObservabilityProvider } from "./observability.js";
import type { PasswordHasher } from "./password.js";
import type { DurableQueueProvider } from "./queue.js";
import type { RandomSource } from "./random.js";
import type { SecretStorageProvider } from "./secret.js";
import type { Clock } from "./time.js";

export interface BoundRuntimeProvider<TProvider> {
  readonly manifest: RuntimeCapabilityManifest;
  readonly provider: TProvider;
}

export interface FoundationalRuntimeDependencies {
  readonly clock: Clock;
  readonly identifiers: IdentifierGenerator;
  readonly random: RandomSource;
}

export interface CryptographicRuntimeDependencies {
  readonly authenticatedEncryption: AuthenticatedEncryptionProvider;
  readonly keyManagement: KeyManagementService;
  readonly passwordHasher: PasswordHasher;
  readonly signing: SigningProvider;
}

export interface StatefulRuntimeDependencies {
  readonly cacheState: CacheStateProvider;
  readonly certificateAutomation: CertificateAutomationProvider;
  readonly dnsAutomation: DnsAutomationProvider;
  readonly durableQueue: DurableQueueProvider;
  readonly frontendDeployment: FrontendDeploymentProvider;
  readonly objectStorage: ObjectStorageProvider;
  readonly secretStorage: SecretStorageProvider;
}

export interface OperationalRuntimeDependencies {
  readonly observability: ObservabilityProvider;
}

export interface RuntimeDependencyCompositionInput extends FoundationalRuntimeDependencies {
  readonly authenticatedEncryption: BoundRuntimeProvider<AuthenticatedEncryptionProvider>;
  readonly cacheState: BoundRuntimeProvider<CacheStateProvider>;
  readonly capabilities: ValidatedCapabilityComposition;
  readonly certificateAutomation: BoundRuntimeProvider<CertificateAutomationProvider>;
  readonly dnsAutomation: BoundRuntimeProvider<DnsAutomationProvider>;
  readonly durableQueue: BoundRuntimeProvider<DurableQueueProvider>;
  readonly frontendDeployment: BoundRuntimeProvider<FrontendDeploymentProvider>;
  readonly keyManagement: BoundRuntimeProvider<KeyManagementService>;
  readonly objectStorage: BoundRuntimeProvider<ObjectStorageProvider>;
  readonly observability: BoundRuntimeProvider<ObservabilityProvider>;
  readonly passwordHasher: BoundRuntimeProvider<PasswordHasher>;
  readonly secretStorage: BoundRuntimeProvider<SecretStorageProvider>;
  readonly signing: BoundRuntimeProvider<SigningProvider>;
}

export interface RuntimeDependencyValues
  extends FoundationalRuntimeDependencies,
    CryptographicRuntimeDependencies,
    StatefulRuntimeDependencies,
    OperationalRuntimeDependencies {}
