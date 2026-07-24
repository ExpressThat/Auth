import { describe, expect, it } from "vitest";
import { ControlledClock } from "../src/determinism.js";
import { FixtureFactory } from "../src/fixture-factory.js";

describe("tenant and environment isolation fixtures", () => {
  it("creates two tenants with distinct users and environments", () => {
    const fixture = new FixtureFactory(new ControlledClock()).isolationFixture();

    expect(fixture.primary.tenant.id).not.toBe(fixture.secondary.tenant.id);
    expect(fixture.primary.user.tenantId).toBe(fixture.primary.tenant.id);
    expect(fixture.secondary.user.tenantId).toBe(fixture.secondary.tenant.id);
    expect(fixture.primary.development.tenantId).toBe(fixture.primary.tenant.id);
    expect(fixture.primary.production.id).not.toBe(fixture.primary.development.id);
    expect(fixture.secondary.development.tenantId).toBe(fixture.secondary.tenant.id);
    expect(fixture.secondary.production.id).not.toBe(fixture.secondary.development.id);
  });

  it("supports an explicit cross-scope environment for denied tests", () => {
    const factory = new FixtureFactory(new ControlledClock());
    const tenant = factory.tenant();

    expect(
      factory.environment(tenant, {
        id: "env_cross_scope",
        name: "Test Cross Scope",
        tenantId: "org_other",
      }),
    ).toEqual({
      id: "env_cross_scope",
      name: "Test Cross Scope",
      tenantId: "org_other",
    });
    expect(factory.environment(tenant).tenantId).toBe(tenant.id);
  });
});
