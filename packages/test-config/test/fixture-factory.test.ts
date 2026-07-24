import { describe, expect, it } from "vitest";
import { ControlledClock } from "../src/determinism.js";
import { FixtureFactory } from "../src/fixture-factory.js";

describe("synthetic fixture factory", () => {
  it("builds related tenant, application, user, and session records", () => {
    const clock = new ControlledClock(1_750_000_000_000);
    const factory = new FixtureFactory(clock);
    const tenant = factory.tenant();
    const application = factory.application(tenant);
    const user = factory.user(tenant);
    const session = factory.session(tenant, application, user);

    expect(tenant).toEqual({
      createdAtMs: clock.now(),
      id: "org_019d2abc-0000-7000-8000-000000000001",
      name: "Test Tenant 1",
      slug: "test-tenant-1",
    });
    expect(application.tenantId).toBe(tenant.id);
    expect(user).toMatchObject({
      displayName: "Test User 3",
      email: "user-3@identity.test",
      tenantId: tenant.id,
    });
    expect(session).toMatchObject({
      applicationId: application.id,
      createdAtMs: clock.now(),
      expiresAtMs: clock.now() + 3_600_000,
      tenantId: tenant.id,
      userId: user.id,
    });
  });

  it("supports explicit safe overrides", () => {
    const clock = new ControlledClock(100);
    const factory = new FixtureFactory(clock, 10);
    const tenant = factory.tenant({
      createdAtMs: 50,
      id: "org_custom",
      name: "Test Custom Tenant",
      slug: "test-custom",
    });
    const application = factory.application(tenant, {
      createdAtMs: 60,
      id: "app_custom",
      name: "Test Custom Application",
      tenantId: "org_override",
    });
    const user = factory.user(tenant, {
      createdAtMs: 70,
      displayName: "Test Custom User",
      email: "custom@fixtures.test",
      id: "usr_custom",
      tenantId: "org_override",
    });
    const handle = factory.secret("custom-session");
    const session = factory.session(tenant, application, user, {
      applicationId: "app_override",
      createdAtMs: 80,
      expiresAtMs: 90,
      handle,
      tenantId: "org_override",
      userId: "usr_override",
    });

    expect(tenant.createdAtMs).toBe(50);
    expect(application).toMatchObject({ id: "app_custom", tenantId: "org_override" });
    expect(user).toMatchObject({ email: "custom@fixtures.test", id: "usr_custom" });
    expect(session).toEqual({
      applicationId: "app_override",
      createdAtMs: 80,
      expiresAtMs: 90,
      handle,
      tenantId: "org_override",
      userId: "usr_override",
    });
  });

  it("creates every typed provider outcome", () => {
    const factory = new FixtureFactory(new ControlledClock());

    expect(factory.providerSuccess({ messageId: "msg_test" })).toEqual({
      status: "success",
      value: { messageId: "msg_test" },
    });
    expect(factory.providerRejected()).toEqual({ code: "test_rejected", status: "rejected" });
    expect(factory.providerRetryableFailure()).toEqual({
      code: "test_retryable_failure",
      retryAfterMs: 1_000,
      status: "retryable-failure",
    });
    expect(factory.providerPermanentFailure()).toEqual({
      code: "test_permanent_failure",
      status: "permanent-failure",
    });
    expect(factory.providerRejected("denied")).toMatchObject({ code: "denied" });
    expect(factory.providerRetryableFailure("busy", 5_000)).toMatchObject({
      code: "busy",
      retryAfterMs: 5_000,
    });
    expect(factory.providerPermanentFailure("invalid")).toMatchObject({ code: "invalid" });
  });

  it("rejects unsafe fixture inputs and exhausted sequences", () => {
    expect(() => new FixtureFactory(new ControlledClock(), 0)).toThrow(RangeError);
    const factory = new FixtureFactory(new ControlledClock());
    const tenant = factory.tenant();

    expect(() => factory.identifier("User")).toThrow(TypeError);
    expect(() => factory.user(tenant, { email: "person@example.com" })).toThrow(TypeError);
    expect(() => factory.user(tenant, { displayName: "Ada Lovelace" })).toThrow(TypeError);

    expect(() => factory.identifier("usr", 0)).toThrow(RangeError);
    expect(() => factory.identifier("usr", Number.NaN)).toThrow(RangeError);
    expect(() => new FixtureFactory(new ControlledClock(), Number.MAX_SAFE_INTEGER)).toThrow(
      RangeError,
    );

    const exhausted = new FixtureFactory(new ControlledClock(), 0xffffffffffff);
    expect(exhausted.identifier("usr")).toContain("usr_");
    expect(() => exhausted.identifier("usr")).toThrow(RangeError);
  });
});
