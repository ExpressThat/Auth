import type {
  Clock,
  DnsAutomationHealth,
  DnsAutomationProvider,
  DnsVerificationObservation,
  DnsVerificationPlan,
  DnsVerificationStatus,
  PrepareDnsVerificationRequest,
  RemoveDnsVerificationRequest,
  RemovedDnsVerification,
  VerifyDnsRequest,
} from "../index.js";
import { AutomationRevision, DnsAutomationError, DomainAutomationReference } from "../index.js";

type DnsRecord = {
  plan: DnsVerificationPlan;
  removed: boolean;
  status: DnsVerificationStatus;
};

export class TestDnsAutomationAdapter implements DnsAutomationProvider {
  readonly #clock: Clock;
  readonly #records = new Map<string, DnsRecord>();
  #sequence = 0;
  public available = true;
  public degraded = false;

  public constructor(clock: Clock) {
    this.#clock = clock;
  }

  public async health(): Promise<DnsAutomationHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.available ? (this.degraded ? "degraded" : "healthy") : "unavailable",
      supportsOwnershipVerification: true,
      supportsRoutingVerification: true,
    };
  }

  public async prepare(request: PrepareDnsVerificationRequest): Promise<DnsVerificationPlan> {
    this.#requireAvailable("prepare");
    if (request.challengeExpiresAt.compare(this.#clock.now()) <= 0) {
      throw new DnsAutomationError("prepare", "expired");
    }
    const collision = [...this.#records.values()].some(
      (record) => !record.removed && record.plan.hostname.equals(request.hostname),
    );
    if (collision) {
      throw new DnsAutomationError("prepare", "conflict");
    }
    this.#sequence += 1;
    const plan: DnsVerificationPlan = {
      ...request,
      reference: DomainAutomationReference.parse(`test:dns/record-${String(this.#sequence)}`),
      revision: AutomationRevision.parse(1),
    };
    this.#records.set(plan.reference.opaqueValue(), {
      plan,
      removed: false,
      status: "pending",
    });
    return { ...plan };
  }

  public async remove(request: RemoveDnsVerificationRequest): Promise<RemovedDnsVerification> {
    this.#requireAvailable("remove");
    const record = this.#record(request, "remove");
    this.#expected(record, request.expectedRevision, "remove");
    record.removed = true;
    record.plan = {
      ...record.plan,
      revision: AutomationRevision.parse(record.plan.revision.numberValue() + 1),
    };
    return {
      reference: record.plan.reference,
      removedAt: this.#clock.now(),
      revision: record.plan.revision,
    };
  }

  public setStatusForTest(
    reference: DomainAutomationReference,
    status: DnsVerificationStatus,
  ): void {
    const record = this.#records.get(reference.opaqueValue());
    if (!record) {
      throw new DnsAutomationError("verify", "not-found");
    }
    record.status = status;
  }

  public async verify(request: VerifyDnsRequest): Promise<DnsVerificationObservation> {
    this.#requireAvailable("verify");
    const record = this.#record(request, "verify");
    this.#expected(record, request.expectedRevision, "verify");
    const expired = record.plan.challengeExpiresAt.compare(this.#clock.now()) <= 0;
    return {
      checkedAt: this.#clock.now(),
      hostname: record.plan.hostname,
      reference: record.plan.reference,
      revision: record.plan.revision,
      status: expired ? "expired" : record.status,
    };
  }

  #expected(record: DnsRecord, expected: AutomationRevision, operation: "remove" | "verify"): void {
    if (record.plan.revision.numberValue() !== expected.numberValue()) {
      throw new DnsAutomationError(operation, "conflict");
    }
  }

  #record(request: VerifyDnsRequest, operation: "remove" | "verify"): DnsRecord {
    const record = this.#records.get(request.reference.opaqueValue());
    if (
      !record ||
      record.removed ||
      record.plan.scope.providerNamespace() !== request.scope.providerNamespace()
    ) {
      throw new DnsAutomationError(operation, "not-found");
    }
    return record;
  }

  #requireAvailable(operation: "prepare" | "remove" | "verify"): void {
    if (!this.available) {
      throw new DnsAutomationError(operation, "unavailable");
    }
  }
}
