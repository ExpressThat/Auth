import type {
  Clock,
  DeployFrontendRequest,
  FrontendDeployment,
  FrontendDeploymentHealth,
  FrontendDeploymentProvider,
  FrontendDeploymentRequest,
  FrontendDeploymentStatusRequest,
  FrontendRollbackRequest,
} from "../index.js";
import {
  AutomationRevision,
  DomainAutomationReference,
  FrontendDeploymentError,
} from "../index.js";

type DeploymentRecord = {
  current: FrontendDeployment;
  history: FrontendDeployment[];
};

export class TestFrontendDeploymentAdapter implements FrontendDeploymentProvider {
  readonly #clock: Clock;
  readonly #hostIndex = new Map<string, string>();
  readonly #records = new Map<string, DeploymentRecord>();
  #sequence = 0;
  public available = true;
  public degraded = false;

  public constructor(clock: Clock) {
    this.#clock = clock;
  }

  public activateForTest(reference: DomainAutomationReference): void {
    const record = this.#records.get(reference.opaqueValue());
    if (!record) {
      throw new FrontendDeploymentError("status", "not-found");
    }
    record.current = {
      ...record.current,
      deployedAt: this.#clock.now(),
      status: "active",
    };
    record.history[record.history.length - 1] = record.current;
  }

  public async deploy(request: DeployFrontendRequest): Promise<FrontendDeployment> {
    this.#requireAvailable("deploy");
    const identity = this.#identity(request);
    const existingReference = this.#hostIndex.get(identity);
    const existing =
      existingReference === undefined ? undefined : this.#records.get(existingReference);
    if (existing) {
      if (
        request.expectedRevision === undefined ||
        existing.current.revision.numberValue() !== request.expectedRevision.numberValue() ||
        existing.current.status === "removed"
      ) {
        throw new FrontendDeploymentError("deploy", "conflict");
      }
      const updated = this.#deployment(
        request,
        existing.current.reference,
        existing.current.revision.numberValue() + 1,
        "deploying",
      );
      existing.current = updated;
      existing.history.push(updated);
      return { ...updated };
    }
    if (request.expectedRevision !== undefined) {
      throw new FrontendDeploymentError("deploy", "conflict");
    }
    this.#sequence += 1;
    const created = this.#deployment(
      request,
      DomainAutomationReference.parse(`test:deployment/site-${String(this.#sequence)}`),
      1,
      "deploying",
    );
    this.#hostIndex.set(identity, created.reference.opaqueValue());
    this.#records.set(created.reference.opaqueValue(), {
      current: created,
      history: [created],
    });
    return { ...created };
  }

  public async health(): Promise<FrontendDeploymentHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.available ? (this.degraded ? "degraded" : "healthy") : "unavailable",
      supportsAtomicActivation: true,
      supportsRollback: true,
    };
  }

  public async remove(request: FrontendDeploymentRequest): Promise<FrontendDeployment> {
    this.#requireAvailable("remove");
    const record = this.#record(request, "remove");
    this.#expected(record, request.expectedRevision, "remove");
    record.current = {
      ...record.current,
      revision: this.#next(record),
      status: "removed",
    };
    record.history.push(record.current);
    return { ...record.current };
  }

  public async rollback(request: FrontendRollbackRequest): Promise<FrontendDeployment> {
    this.#requireAvailable("rollback");
    const record = this.#record(request, "rollback");
    this.#expected(record, request.expectedRevision, "rollback");
    const target = record.history.find(
      (candidate) => candidate.revision.numberValue() === request.targetRevision.numberValue(),
    );
    if (target?.status !== "active") {
      throw new FrontendDeploymentError("rollback", "not-found");
    }
    const { deployedAt: _deployedAt, ...targetWithoutActivation } = target;
    record.current = {
      ...targetWithoutActivation,
      revision: this.#next(record),
      status: "rolling-back",
    };
    record.history.push(record.current);
    return { ...record.current };
  }

  public async status(
    request: FrontendDeploymentStatusRequest,
  ): Promise<FrontendDeployment | undefined> {
    this.#requireAvailable("status");
    const record = this.#records.get(request.reference.opaqueValue());
    return record?.current.scope.providerNamespace() === request.scope.providerNamespace()
      ? { ...record.current }
      : undefined;
  }

  public async verify(request: FrontendDeploymentRequest): Promise<FrontendDeployment> {
    this.#requireAvailable("verify");
    const record = this.#record(request, "verify");
    this.#expected(record, request.expectedRevision, "verify");
    if (record.current.status !== "active") {
      throw new FrontendDeploymentError("verify", "not-ready");
    }
    return { ...record.current };
  }

  #deployment(
    request: DeployFrontendRequest,
    reference: DomainAutomationReference,
    revision: number,
    status: "deploying",
  ): FrontendDeployment {
    return {
      artifactDigest: request.artifactDigest,
      artifactReference: request.artifactReference,
      certificateReference: request.certificateReference,
      hostname: request.hostname,
      reference,
      revision: AutomationRevision.parse(revision),
      scope: request.scope,
      status,
    };
  }

  #expected(
    record: DeploymentRecord,
    expected: AutomationRevision,
    operation: "remove" | "rollback" | "verify",
  ): void {
    if (record.current.revision.numberValue() !== expected.numberValue()) {
      throw new FrontendDeploymentError(operation, "conflict");
    }
  }

  #identity(request: Pick<DeployFrontendRequest, "hostname" | "scope">): string {
    return `${request.scope.providerNamespace()}|${request.hostname.value()}`;
  }

  #next(record: DeploymentRecord): AutomationRevision {
    return AutomationRevision.parse(record.current.revision.numberValue() + 1);
  }

  #record(
    request: FrontendDeploymentStatusRequest,
    operation: "remove" | "rollback" | "verify",
  ): DeploymentRecord {
    const record = this.#records.get(request.reference.opaqueValue());
    if (!record || record.current.scope.providerNamespace() !== request.scope.providerNamespace()) {
      throw new FrontendDeploymentError(operation, "not-found");
    }
    return record;
  }

  #requireAvailable(operation: "deploy" | "remove" | "rollback" | "status" | "verify"): void {
    if (!this.available) {
      throw new FrontendDeploymentError(operation, "unavailable");
    }
  }
}
