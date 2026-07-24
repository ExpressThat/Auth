import type {
  AutomationRevision,
  DnsRecordName,
  DomainAutomationReference,
  DomainChallengeValue,
  ManagedDomainScope,
  ManagedHostname,
} from "./managed-domain-values.js";
import type { EpochMilliseconds } from "./time.js";

export type DnsAutomationOperation = "health" | "prepare" | "remove" | "verify";
export type DnsAutomationErrorCode =
  | "conflict"
  | "expired"
  | "invalid"
  | "not-found"
  | "residency-violation"
  | "unavailable";
export type DnsAutomationHealthStatus = "degraded" | "healthy" | "unavailable";
export type DnsVerificationStatus =
  | "conflict"
  | "expired"
  | "pending"
  | "routing-mismatch"
  | "verified";

export interface PrepareDnsVerificationRequest {
  readonly challenge: DomainChallengeValue;
  readonly challengeExpiresAt: EpochMilliseconds;
  readonly challengeRecord: DnsRecordName;
  readonly hostname: ManagedHostname;
  readonly routingTarget: ManagedHostname;
  readonly scope: ManagedDomainScope;
}

export interface DnsVerificationPlan {
  readonly challenge: DomainChallengeValue;
  readonly challengeExpiresAt: EpochMilliseconds;
  readonly challengeRecord: DnsRecordName;
  readonly hostname: ManagedHostname;
  readonly reference: DomainAutomationReference;
  readonly revision: AutomationRevision;
  readonly routingTarget: ManagedHostname;
  readonly scope: ManagedDomainScope;
}

export interface VerifyDnsRequest {
  readonly expectedRevision: AutomationRevision;
  readonly reference: DomainAutomationReference;
  readonly scope: ManagedDomainScope;
}

export interface DnsVerificationObservation {
  readonly checkedAt: EpochMilliseconds;
  readonly hostname: ManagedHostname;
  readonly reference: DomainAutomationReference;
  readonly revision: AutomationRevision;
  readonly status: DnsVerificationStatus;
}

export interface RemoveDnsVerificationRequest extends VerifyDnsRequest {}

export interface RemovedDnsVerification {
  readonly reference: DomainAutomationReference;
  readonly removedAt: EpochMilliseconds;
  readonly revision: AutomationRevision;
}

export interface DnsAutomationHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: DnsAutomationHealthStatus;
  readonly supportsOwnershipVerification: boolean;
  readonly supportsRoutingVerification: boolean;
}

export interface DnsAutomationProvider {
  health(): Promise<DnsAutomationHealth>;
  prepare(request: PrepareDnsVerificationRequest): Promise<DnsVerificationPlan>;
  remove(request: RemoveDnsVerificationRequest): Promise<RemovedDnsVerification>;
  verify(request: VerifyDnsRequest): Promise<DnsVerificationObservation>;
}

export class DnsAutomationError extends Error {
  public readonly code: DnsAutomationErrorCode;
  public readonly operation: DnsAutomationOperation;
  public readonly retryable: boolean;

  public constructor(operation: DnsAutomationOperation, code: DnsAutomationErrorCode) {
    super(`DNS automation ${operation} failed (${code}).`);
    this.name = "DnsAutomationError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: DnsAutomationErrorCode;
    operation: DnsAutomationOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
