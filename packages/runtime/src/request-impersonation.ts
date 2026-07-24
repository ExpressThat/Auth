import { PrincipalReference } from "./request-principal.js";
import { EpochMilliseconds } from "./time.js";

abstract class ImpersonationOpaqueId {
  readonly #value: string;

  protected constructor(value: unknown, label: string) {
    if (
      typeof value !== "string" ||
      value.length < 16 ||
      value.length > 200 ||
      !/^[A-Za-z0-9._:/-]+$/u.test(value)
    ) {
      throw new TypeError(`${label} must use the bounded opaque format.`);
    }
    this.#value = value;
  }

  public value(): string {
    return this.#value;
  }

  public toJSON(): string {
    return "[REDACTED IMPERSONATION REFERENCE]";
  }
}

export class ImpersonationSessionId extends ImpersonationOpaqueId {
  private constructor(value: unknown) {
    super(value, "Impersonation session ID");
  }

  public static parse(value: unknown): ImpersonationSessionId {
    return new ImpersonationSessionId(value);
  }
}

export class ImpersonationGrantId extends ImpersonationOpaqueId {
  private constructor(value: unknown) {
    super(value, "Impersonation grant ID");
  }

  public static parse(value: unknown): ImpersonationGrantId {
    return new ImpersonationGrantId(value);
  }
}

export class RequestAction {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): RequestAction {
    if (
      typeof value !== "string" ||
      value.length < 3 ||
      value.length > 100 ||
      !/^[a-z][a-z0-9]*(?:[.:_-][a-z0-9]+)+$/u.test(value)
    ) {
      throw new TypeError("Request action must use the bounded namespaced format.");
    }
    return new RequestAction(value);
  }

  public value(): string {
    return this.#value;
  }
}

export class NoImpersonationContext {
  public readonly kind = "none";

  public toJSON(): string {
    return "[NO IMPERSONATION]";
  }
}

export interface ActiveImpersonationInput {
  readonly actions: readonly RequestAction[];
  readonly actor: PrincipalReference;
  readonly expiresAt: EpochMilliseconds;
  readonly grantId: ImpersonationGrantId;
  readonly sessionId: ImpersonationSessionId;
  readonly startedAt: EpochMilliseconds;
  readonly subject: PrincipalReference;
}

export class ActiveImpersonationContext {
  public readonly kind = "active";
  readonly #input: ActiveImpersonationInput;

  private constructor(input: ActiveImpersonationInput) {
    this.#input = { ...input, actions: [...input.actions] };
  }

  public static create(input: ActiveImpersonationInput): ActiveImpersonationContext {
    if (
      !(input.actor instanceof PrincipalReference) ||
      input.actor.kind !== "management-user" ||
      !(input.subject instanceof PrincipalReference) ||
      input.subject.kind !== "end-user" ||
      input.actor.sameIdentity(input.subject) ||
      input.actions.length < 1 ||
      input.actions.some((action) => !(action instanceof RequestAction)) ||
      new Set(input.actions.map((action) => action.value())).size !== input.actions.length ||
      !(input.startedAt instanceof EpochMilliseconds) ||
      !(input.expiresAt instanceof EpochMilliseconds) ||
      input.expiresAt.compare(input.startedAt) <= 0
    ) {
      throw new TypeError("Active impersonation context is incomplete or prohibited.");
    }
    return new ActiveImpersonationContext(input);
  }

  public actions(): readonly RequestAction[] {
    return [...this.#input.actions];
  }

  public actor(): PrincipalReference {
    return this.#input.actor;
  }

  public expiresAt(): EpochMilliseconds {
    return this.#input.expiresAt;
  }

  public grantId(): ImpersonationGrantId {
    return this.#input.grantId;
  }

  public sessionId(): ImpersonationSessionId {
    return this.#input.sessionId;
  }

  public subject(): PrincipalReference {
    return this.#input.subject;
  }

  public startedAt(): EpochMilliseconds {
    return this.#input.startedAt;
  }

  public toJSON(): string {
    return "[REDACTED ACTIVE IMPERSONATION]";
  }
}

export type ImpersonationContext = ActiveImpersonationContext | NoImpersonationContext;
