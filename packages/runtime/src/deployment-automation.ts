import type {
  AutomationRevision,
  DomainAutomationReference,
  FrontendArtifactDigest,
  FrontendArtifactReference,
  ManagedDomainScope,
  ManagedHostname,
} from "./managed-domain-values.js";
import type { EpochMilliseconds } from "./time.js";

export type FrontendDeploymentOperation =
  | "deploy"
  | "health"
  | "remove"
  | "rollback"
  | "status"
  | "verify";
export type FrontendDeploymentErrorCode =
  | "conflict"
  | "integrity-failure"
  | "invalid"
  | "not-found"
  | "not-ready"
  | "residency-violation"
  | "unavailable";
export type FrontendDeploymentStatus =
  | "active"
  | "deploying"
  | "failed"
  | "removed"
  | "rolling-back";
export type FrontendDeploymentHealthStatus = "degraded" | "healthy" | "unavailable";

export interface DeployFrontendRequest {
  readonly artifactDigest: FrontendArtifactDigest;
  readonly artifactReference: FrontendArtifactReference;
  readonly certificateReference: DomainAutomationReference;
  readonly expectedRevision?: AutomationRevision;
  readonly hostname: ManagedHostname;
  readonly scope: ManagedDomainScope;
}

export interface FrontendDeployment {
  readonly artifactDigest: FrontendArtifactDigest;
  readonly artifactReference: FrontendArtifactReference;
  readonly certificateReference: DomainAutomationReference;
  readonly deployedAt?: EpochMilliseconds;
  readonly hostname: ManagedHostname;
  readonly reference: DomainAutomationReference;
  readonly revision: AutomationRevision;
  readonly scope: ManagedDomainScope;
  readonly status: FrontendDeploymentStatus;
}

export interface FrontendDeploymentRequest {
  readonly expectedRevision: AutomationRevision;
  readonly reference: DomainAutomationReference;
  readonly scope: ManagedDomainScope;
}

export interface FrontendRollbackRequest extends FrontendDeploymentRequest {
  readonly targetRevision: AutomationRevision;
}

export interface FrontendDeploymentStatusRequest {
  readonly reference: DomainAutomationReference;
  readonly scope: ManagedDomainScope;
}

export interface FrontendDeploymentHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: FrontendDeploymentHealthStatus;
  readonly supportsAtomicActivation: boolean;
  readonly supportsRollback: boolean;
}

export interface FrontendDeploymentProvider {
  deploy(request: DeployFrontendRequest): Promise<FrontendDeployment>;
  health(): Promise<FrontendDeploymentHealth>;
  remove(request: FrontendDeploymentRequest): Promise<FrontendDeployment>;
  rollback(request: FrontendRollbackRequest): Promise<FrontendDeployment>;
  status(request: FrontendDeploymentStatusRequest): Promise<FrontendDeployment | undefined>;
  verify(request: FrontendDeploymentRequest): Promise<FrontendDeployment>;
}

export class FrontendDeploymentError extends Error {
  public readonly code: FrontendDeploymentErrorCode;
  public readonly operation: FrontendDeploymentOperation;
  public readonly retryable: boolean;

  public constructor(operation: FrontendDeploymentOperation, code: FrontendDeploymentErrorCode) {
    super(`Frontend deployment ${operation} failed (${code}).`);
    this.name = "FrontendDeploymentError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "not-ready" || code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: FrontendDeploymentErrorCode;
    operation: FrontendDeploymentOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
