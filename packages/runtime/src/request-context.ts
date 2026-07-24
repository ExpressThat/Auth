import { CorrelationId } from "./observability-values.js";
import { AssuranceContext } from "./request-assurance.js";
import {
  ActiveImpersonationContext,
  type ImpersonationContext,
  NoImpersonationContext,
  RequestAction,
} from "./request-impersonation.js";
import { NetworkContext } from "./request-network.js";
import { PrincipalReference } from "./request-principal.js";
import { TrustedTenantContext } from "./request-tenant.js";
import { EpochMilliseconds } from "./time.js";

export interface RequestContextInput {
  readonly action: RequestAction;
  readonly actor: PrincipalReference;
  readonly assurance: AssuranceContext;
  readonly correlationId: CorrelationId;
  readonly impersonation: ImpersonationContext;
  readonly network: NetworkContext;
  readonly receivedAt: EpochMilliseconds;
  readonly requestId: CorrelationId;
  readonly subject: PrincipalReference;
  readonly tenant: TrustedTenantContext;
}

export class RequestContext {
  readonly #input: RequestContextInput;

  private constructor(input: RequestContextInput) {
    this.#input = input;
  }

  public static create(input: RequestContextInput): RequestContext {
    requireValueObjects(input);
    const anonymous = input.actor.kind === "anonymous";
    if (
      (anonymous && input.assurance.level() !== "anonymous") ||
      (!anonymous && input.assurance.level() === "anonymous")
    ) {
      throw new TypeError("Actor and authentication assurance are inconsistent.");
    }
    if (input.impersonation instanceof ActiveImpersonationContext) {
      if (
        input.tenant.plane() !== "customer" ||
        !input.actor.sameIdentity(input.impersonation.actor()) ||
        !input.subject.sameIdentity(input.impersonation.subject()) ||
        input.impersonation.expiresAt().compare(input.receivedAt) <= 0 ||
        !input.impersonation.actions().some((action) => action.value() === input.action.value())
      ) {
        throw new TypeError("Impersonation does not authorize this request context.");
      }
    } else if (!input.actor.sameIdentity(input.subject)) {
      throw new TypeError("Actor and subject may differ only during explicit impersonation.");
    }
    if (
      input.impersonation instanceof NoImpersonationContext &&
      !planeAllowsActor(input.tenant, input.actor)
    ) {
      throw new TypeError("Actor plane does not match the trusted tenant context.");
    }
    return new RequestContext(input);
  }

  public action(): RequestAction {
    return this.#input.action;
  }

  public actor(): PrincipalReference {
    return this.#input.actor;
  }

  public assurance(): AssuranceContext {
    return this.#input.assurance;
  }

  public correlationId(): CorrelationId {
    return this.#input.correlationId;
  }

  public impersonation(): ImpersonationContext {
    return this.#input.impersonation;
  }

  public network(): NetworkContext {
    return this.#input.network;
  }

  public requestId(): CorrelationId {
    return this.#input.requestId;
  }

  public receivedAt(): EpochMilliseconds {
    return this.#input.receivedAt;
  }

  public subject(): PrincipalReference {
    return this.#input.subject;
  }

  public tenant(): TrustedTenantContext {
    return this.#input.tenant;
  }

  public toJSON(): string {
    return "[REDACTED REQUEST CONTEXT]";
  }
}

function planeAllowsActor(tenant: TrustedTenantContext, actor: PrincipalReference): boolean {
  if (tenant.plane() === "management") {
    return actor.plane === "management";
  }
  return actor.plane === "customer" || actor.plane === "public";
}

function requireValueObjects(input: RequestContextInput): void {
  if (
    !(input.action instanceof RequestAction) ||
    !(input.actor instanceof PrincipalReference) ||
    !(input.assurance instanceof AssuranceContext) ||
    !(input.correlationId instanceof CorrelationId) ||
    !(
      input.impersonation instanceof ActiveImpersonationContext ||
      input.impersonation instanceof NoImpersonationContext
    ) ||
    !(input.network instanceof NetworkContext) ||
    !(input.receivedAt instanceof EpochMilliseconds) ||
    !(input.requestId instanceof CorrelationId) ||
    !(input.subject instanceof PrincipalReference) ||
    !(input.tenant instanceof TrustedTenantContext)
  ) {
    throw new TypeError("Request context requires validated immutable value objects.");
  }
}
