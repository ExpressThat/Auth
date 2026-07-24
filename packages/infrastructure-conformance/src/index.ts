export { requiredConformanceAxes } from "./capability-policy.js";
export {
  type ConformanceProbe,
  type CustodyConformanceProbes,
  defineCacheConformanceSuite,
  defineCertificateConformanceSuite,
  defineDeploymentConformanceSuite,
  defineDnsConformanceSuite,
  defineKeyManagementConformanceSuite,
  defineObjectStorageConformanceSuite,
  defineObservabilityConformanceSuite,
  defineQueueConformanceSuite,
  defineSecretConformanceSuite,
  type StatefulConformanceProbes,
} from "./capability-suites.js";
export {
  assertConcurrentSuccess,
  assertNormalizedAdapterError,
  assertNoSecretLeak,
  captureAdapterFailure,
  type NormalizedAdapterError,
} from "./conformance-assertions.js";
export {
  ConformanceDefinitionError,
  ConformanceExecutionError,
} from "./conformance-error.js";
export type {
  ConformanceAxis,
  ConformanceCaseContext,
  ConformanceCaseInput,
  ConformanceCaseResult,
  ConformanceDefinitionCode,
  ConformanceExecutionCode,
  InfrastructureCapabilityKind,
  InfrastructureConformanceReport,
  InfrastructureConformanceSuiteInput,
} from "./conformance-model.js";
export { InfrastructureConformanceSuite } from "./conformance-suite.js";
