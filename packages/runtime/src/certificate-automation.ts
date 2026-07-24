import type {
  AutomationRevision,
  DomainAutomationReference,
  ManagedDomainScope,
  ManagedHostname,
} from "./managed-domain-values.js";
import type { EpochMilliseconds } from "./time.js";

export type CertificateAutomationOperation = "health" | "issue" | "renew" | "revoke" | "status";
export type CertificateAutomationErrorCode =
  | "conflict"
  | "invalid"
  | "not-found"
  | "not-ready"
  | "residency-violation"
  | "unavailable";
export type CertificateLifecycleStatus = "active" | "failed" | "issuing" | "renewing" | "revoked";
export type CertificateAutomationHealthStatus = "degraded" | "healthy" | "unavailable";

export interface IssueCertificateRequest {
  readonly dnsVerificationReference: DomainAutomationReference;
  readonly hostname: ManagedHostname;
  readonly scope: ManagedDomainScope;
}

export interface CertificateMetadata {
  readonly dnsVerificationReference: DomainAutomationReference;
  readonly expiresAt?: EpochMilliseconds;
  readonly hostname: ManagedHostname;
  readonly issuedAt?: EpochMilliseconds;
  readonly reference: DomainAutomationReference;
  readonly revision: AutomationRevision;
  readonly scope: ManagedDomainScope;
  readonly status: CertificateLifecycleStatus;
}

export interface CertificateMutationRequest {
  readonly expectedRevision: AutomationRevision;
  readonly reference: DomainAutomationReference;
  readonly scope: ManagedDomainScope;
}

export interface CertificateStatusRequest {
  readonly reference: DomainAutomationReference;
  readonly scope: ManagedDomainScope;
}

export interface CertificateAutomationHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: CertificateAutomationHealthStatus;
  readonly supportsAutomaticRenewal: boolean;
  readonly supportsKeylessCustody: boolean;
}

export interface CertificateAutomationProvider {
  health(): Promise<CertificateAutomationHealth>;
  issue(request: IssueCertificateRequest): Promise<CertificateMetadata>;
  renew(request: CertificateMutationRequest): Promise<CertificateMetadata>;
  revoke(request: CertificateMutationRequest): Promise<CertificateMetadata>;
  status(request: CertificateStatusRequest): Promise<CertificateMetadata | undefined>;
}

export class CertificateAutomationError extends Error {
  public readonly code: CertificateAutomationErrorCode;
  public readonly operation: CertificateAutomationOperation;
  public readonly retryable: boolean;

  public constructor(
    operation: CertificateAutomationOperation,
    code: CertificateAutomationErrorCode,
  ) {
    super(`Certificate automation ${operation} failed (${code}).`);
    this.name = "CertificateAutomationError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "not-ready" || code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: CertificateAutomationErrorCode;
    operation: CertificateAutomationOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
