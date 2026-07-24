import { EpochMilliseconds } from "./time.js";

export type AuthenticationAssuranceLevel = "aal1" | "aal2" | "aal3" | "anonymous";
export type AuthenticationMethod =
  | "client-secret"
  | "enterprise"
  | "mtls"
  | "passkey"
  | "password"
  | "private-key-jwt"
  | "recovery"
  | "social"
  | "totp";

export interface AssuranceContextInput {
  readonly authenticatedAt?: EpochMilliseconds;
  readonly level: AuthenticationAssuranceLevel;
  readonly methods: readonly AuthenticationMethod[];
  readonly stepUpExpiresAt?: EpochMilliseconds;
}

export class AssuranceContext {
  readonly #input: AssuranceContextInput;

  private constructor(input: AssuranceContextInput) {
    this.#input = { ...input, methods: [...input.methods] };
  }

  public static create(input: AssuranceContextInput): AssuranceContext {
    const levels: readonly AuthenticationAssuranceLevel[] = ["aal1", "aal2", "aal3", "anonymous"];
    const methods: readonly AuthenticationMethod[] = [
      "client-secret",
      "enterprise",
      "mtls",
      "passkey",
      "password",
      "private-key-jwt",
      "recovery",
      "social",
      "totp",
    ];
    const anonymous = input.level === "anonymous";
    if (
      !levels.includes(input.level) ||
      input.methods.some((method) => !methods.includes(method)) ||
      (input.authenticatedAt !== undefined &&
        !(input.authenticatedAt instanceof EpochMilliseconds)) ||
      (input.stepUpExpiresAt !== undefined &&
        !(input.stepUpExpiresAt instanceof EpochMilliseconds)) ||
      (anonymous && (input.methods.length > 0 || input.authenticatedAt || input.stepUpExpiresAt)) ||
      (!anonymous && (!input.authenticatedAt || input.methods.length < 1)) ||
      new Set(input.methods).size !== input.methods.length ||
      (input.stepUpExpiresAt !== undefined &&
        input.authenticatedAt !== undefined &&
        input.stepUpExpiresAt.compare(input.authenticatedAt) <= 0)
    ) {
      throw new TypeError("Assurance context is incomplete or inconsistent.");
    }
    return new AssuranceContext(input);
  }

  public level(): AuthenticationAssuranceLevel {
    return this.#input.level;
  }

  public authenticatedAt(): EpochMilliseconds | undefined {
    return this.#input.authenticatedAt;
  }

  public methods(): readonly AuthenticationMethod[] {
    return [...this.#input.methods];
  }

  public satisfies(required: Exclude<AuthenticationAssuranceLevel, "anonymous">): boolean {
    const rank = { aal1: 1, aal2: 2, aal3: 3, anonymous: 0 } as const;
    return rank[this.#input.level] >= rank[required];
  }

  public stepUpExpiresAt(): EpochMilliseconds | undefined {
    return this.#input.stepUpExpiresAt;
  }

  public toJSON(): string {
    return "[REDACTED ASSURANCE CONTEXT]";
  }
}
