export type SecuritySeverity = "critical" | "high" | "info" | "low" | "medium";

export type SecurityGate = "commit" | "release";

export interface SecurityFinding {
  readonly message: string;
  readonly path: string;
  readonly ruleId: string;
  readonly severity: SecuritySeverity;
  readonly tool: string;
}

export interface SecuritySuppression {
  readonly compensatingControl: string;
  readonly createdOn: string;
  readonly expiresOn: string;
  readonly id: string;
  readonly owner: string;
  readonly path: string;
  readonly reason: string;
  readonly ruleId: string;
  readonly tool: string;
  readonly trackingUrl: string;
}

export interface SecuritySuppressionRegistry {
  readonly suppressions: readonly SecuritySuppression[];
  readonly version: 1;
}

export interface SecurityDecision extends SecurityFinding {
  readonly blocked: boolean;
  readonly suppressionId?: string;
}
