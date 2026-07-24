export type InfrastructureCapabilityKind =
  | "cache"
  | "key-management"
  | "object-storage"
  | "observability"
  | "queue"
  | "secret";

export type ConformanceAxis =
  | "concurrency"
  | "failure"
  | "health"
  | "redaction"
  | "residency"
  | "retry"
  | "runtime"
  | "success"
  | "timeout";

export interface ConformanceCaseContext {
  readonly signal: AbortSignal;
}

export interface ConformanceCaseInput {
  readonly axis: ConformanceAxis;
  readonly name: string;
  readonly run: (context: ConformanceCaseContext) => Promise<void>;
}

export interface InfrastructureConformanceSuiteInput {
  readonly capability: InfrastructureCapabilityKind;
  readonly cases: readonly ConformanceCaseInput[];
  readonly timeoutMilliseconds: number;
}

export interface ConformanceCaseResult {
  readonly axis: ConformanceAxis;
  readonly name: string;
  readonly status: "passed";
}

export interface InfrastructureConformanceReport {
  readonly capability: InfrastructureCapabilityKind;
  readonly results: readonly ConformanceCaseResult[];
}

export type ConformanceDefinitionCode =
  | "duplicate-case"
  | "invalid-case"
  | "invalid-timeout"
  | "missing-axis"
  | "unexpected-axis";

export type ConformanceExecutionCode = "case-failed" | "case-timeout";
