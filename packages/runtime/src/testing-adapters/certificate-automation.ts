import type {
  CertificateAutomationHealth,
  CertificateAutomationProvider,
  CertificateMetadata,
  CertificateMutationRequest,
  CertificateStatusRequest,
  Clock,
  EpochMilliseconds,
  IssueCertificateRequest,
} from "../index.js";
import {
  AutomationRevision,
  CertificateAutomationError,
  DomainAutomationReference,
} from "../index.js";

type CertificateRecord = { metadata: CertificateMetadata };

export class TestCertificateAutomationAdapter implements CertificateAutomationProvider {
  readonly #clock: Clock;
  readonly #records = new Map<string, CertificateRecord>();
  #sequence = 0;
  public available = true;
  public degraded = false;

  public constructor(clock: Clock) {
    this.#clock = clock;
  }

  public activateForTest(reference: DomainAutomationReference, expiresAt: EpochMilliseconds): void {
    const record = this.#records.get(reference.opaqueValue());
    if (!record) {
      throw new CertificateAutomationError("status", "not-found");
    }
    record.metadata = {
      ...record.metadata,
      expiresAt,
      issuedAt: this.#clock.now(),
      status: "active",
    };
  }

  public async health(): Promise<CertificateAutomationHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.available ? (this.degraded ? "degraded" : "healthy") : "unavailable",
      supportsAutomaticRenewal: true,
      supportsKeylessCustody: true,
    };
  }

  public async issue(request: IssueCertificateRequest): Promise<CertificateMetadata> {
    this.#requireAvailable("issue");
    const collision = [...this.#records.values()].some(
      (record) =>
        record.metadata.status !== "revoked" && record.metadata.hostname.equals(request.hostname),
    );
    if (collision) {
      throw new CertificateAutomationError("issue", "conflict");
    }
    this.#sequence += 1;
    const metadata: CertificateMetadata = {
      dnsVerificationReference: request.dnsVerificationReference,
      hostname: request.hostname,
      reference: DomainAutomationReference.parse(`test:certificate/cert-${String(this.#sequence)}`),
      revision: AutomationRevision.parse(1),
      scope: request.scope,
      status: "issuing",
    };
    this.#records.set(metadata.reference.opaqueValue(), { metadata });
    return { ...metadata };
  }

  public async renew(request: CertificateMutationRequest): Promise<CertificateMetadata> {
    this.#requireAvailable("renew");
    const record = this.#record(request, "renew");
    this.#expected(record, request.expectedRevision, "renew");
    if (record.metadata.status !== "active") {
      throw new CertificateAutomationError("renew", "not-ready");
    }
    record.metadata = {
      ...record.metadata,
      revision: this.#next(record),
      status: "renewing",
    };
    return { ...record.metadata };
  }

  public async revoke(request: CertificateMutationRequest): Promise<CertificateMetadata> {
    this.#requireAvailable("revoke");
    const record = this.#record(request, "revoke");
    this.#expected(record, request.expectedRevision, "revoke");
    record.metadata = {
      ...record.metadata,
      revision: this.#next(record),
      status: "revoked",
    };
    return { ...record.metadata };
  }

  public async status(request: CertificateStatusRequest): Promise<CertificateMetadata | undefined> {
    this.#requireAvailable("status");
    const record = this.#records.get(request.reference.opaqueValue());
    return record?.metadata.scope.providerNamespace() === request.scope.providerNamespace()
      ? { ...record.metadata }
      : undefined;
  }

  #expected(
    record: CertificateRecord,
    expected: AutomationRevision,
    operation: "renew" | "revoke",
  ): void {
    if (record.metadata.revision.numberValue() !== expected.numberValue()) {
      throw new CertificateAutomationError(operation, "conflict");
    }
  }

  #next(record: CertificateRecord): AutomationRevision {
    return AutomationRevision.parse(record.metadata.revision.numberValue() + 1);
  }

  #record(request: CertificateMutationRequest, operation: "renew" | "revoke"): CertificateRecord {
    const record = this.#records.get(request.reference.opaqueValue());
    if (
      !record ||
      record.metadata.scope.providerNamespace() !== request.scope.providerNamespace()
    ) {
      throw new CertificateAutomationError(operation, "not-found");
    }
    return record;
  }

  #requireAvailable(operation: "issue" | "renew" | "revoke" | "status"): void {
    if (!this.available) {
      throw new CertificateAutomationError(operation, "unavailable");
    }
  }
}
