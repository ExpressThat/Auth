import type {
  ApplicationFixture,
  FixtureOverrides,
  ProviderOutcome,
  SessionFixture,
  TenantFixture,
  UserFixture,
} from "./fixture-model.js";
import { SyntheticSecret } from "./synthetic-secret.js";

type TestClock = {
  now(): number;
};

const PREFIX_PATTERN = /^[a-z][a-z0-9]*$/u;
const SYNTHETIC_EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.test$/u;
const SYNTHETIC_NAME_PATTERN = /^(?:Synthetic|Test)\b/u;
const MAX_FIXTURE_SEQUENCE = 0xffffffffffff;

export class FixtureFactory {
  readonly #clock: TestClock;
  #sequence: number;

  public constructor(clock: TestClock, initialSequence = 1) {
    if (
      !Number.isSafeInteger(initialSequence) ||
      initialSequence < 1 ||
      initialSequence > MAX_FIXTURE_SEQUENCE
    ) {
      throw new RangeError("Fixture sequence must be a positive safe integer.");
    }
    this.#clock = clock;
    this.#sequence = initialSequence;
  }

  public application(
    tenant: TenantFixture,
    overrides: FixtureOverrides<ApplicationFixture> = {},
  ): ApplicationFixture {
    const sequence = this.nextSequence();
    return {
      createdAtMs: overrides.createdAtMs ?? this.#clock.now(),
      id: overrides.id ?? this.identifier("app", sequence),
      name: overrides.name ?? `Test Application ${sequence}`,
      tenantId: overrides.tenantId ?? tenant.id,
    };
  }

  public identifier(prefix: string, sequence = this.nextSequence()): string {
    if (!PREFIX_PATTERN.test(prefix)) {
      throw new TypeError("Fixture identifier prefixes must be lowercase ASCII.");
    }
    if (!Number.isSafeInteger(sequence) || sequence < 1 || sequence > MAX_FIXTURE_SEQUENCE) {
      throw new RangeError("Fixture identifier sequence is outside the supported range.");
    }
    const suffix = sequence.toString(16).padStart(12, "0");
    return `${prefix}_019d2abc-0000-7000-8000-${suffix}`;
  }

  public providerPermanentFailure(code = "test_permanent_failure"): ProviderOutcome<never> {
    return { code, status: "permanent-failure" };
  }

  public providerRejected(code = "test_rejected"): ProviderOutcome<never> {
    return { code, status: "rejected" };
  }

  public providerRetryableFailure(
    code = "test_retryable_failure",
    retryAfterMs = 1_000,
  ): ProviderOutcome<never> {
    return { code, retryAfterMs, status: "retryable-failure" };
  }

  public providerSuccess<T>(value: T): ProviderOutcome<T> {
    return { status: "success", value };
  }

  public secret(kind = "secret"): SyntheticSecret {
    return new SyntheticSecret(kind, this.nextSequence());
  }

  public session(
    tenant: TenantFixture,
    application: ApplicationFixture,
    user: UserFixture,
    overrides: Partial<Omit<SessionFixture, "handle">> & { handle?: SyntheticSecret } = {},
  ): SessionFixture {
    const createdAtMs = overrides.createdAtMs ?? this.#clock.now();
    return {
      applicationId: overrides.applicationId ?? application.id,
      createdAtMs,
      expiresAtMs: overrides.expiresAtMs ?? createdAtMs + 3_600_000,
      handle: overrides.handle ?? this.secret("session"),
      tenantId: overrides.tenantId ?? tenant.id,
      userId: overrides.userId ?? user.id,
    };
  }

  public tenant(overrides: FixtureOverrides<TenantFixture> = {}): TenantFixture {
    const sequence = this.nextSequence();
    return {
      createdAtMs: overrides.createdAtMs ?? this.#clock.now(),
      id: overrides.id ?? this.identifier("org", sequence),
      name: overrides.name ?? `Test Tenant ${sequence}`,
      slug: overrides.slug ?? `test-tenant-${sequence}`,
    };
  }

  public user(tenant: TenantFixture, overrides: FixtureOverrides<UserFixture> = {}): UserFixture {
    const sequence = this.nextSequence();
    const email = overrides.email ?? `user-${sequence}@identity.test`;
    const displayName = overrides.displayName ?? `Test User ${sequence}`;
    if (!SYNTHETIC_EMAIL_PATTERN.test(email)) {
      throw new TypeError("Fixture emails must use a reserved .test domain.");
    }
    if (!SYNTHETIC_NAME_PATTERN.test(displayName)) {
      throw new TypeError("Fixture display names must be visibly synthetic.");
    }
    return {
      createdAtMs: overrides.createdAtMs ?? this.#clock.now(),
      displayName,
      email,
      id: overrides.id ?? this.identifier("usr", sequence),
      tenantId: overrides.tenantId ?? tenant.id,
    };
  }

  private nextSequence(): number {
    const selected = this.#sequence;
    if (!Number.isSafeInteger(selected) || selected > MAX_FIXTURE_SEQUENCE) {
      throw new RangeError("Fixture sequence is exhausted.");
    }
    this.#sequence += 1;
    return selected;
  }
}
