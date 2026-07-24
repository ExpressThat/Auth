import { describe, expect, it } from "vitest";
import {
  AutomationRevision,
  DomainAutomationReference,
  EpochMilliseconds,
  ManagedHostname,
} from "../src/index.js";
import { TestCertificateAutomationAdapter } from "../src/testing.js";
import { managedDomainFixture, managedScope } from "./managed-domain-test-fixture.js";

function fixture() {
  const values = managedDomainFixture();
  return {
    adapter: new TestCertificateAutomationAdapter(values.clock),
    request: {
      dnsVerificationReference: values.dnsReference,
      hostname: values.hostname,
      scope: values.scope,
    },
    values,
  };
}

describe("deterministic certificate automation adapter", () => {
  it("reports healthy, degraded, and unavailable states", async () => {
    const { adapter } = fixture();

    expect((await adapter.health()).status).toBe("healthy");
    adapter.degraded = true;
    expect((await adapter.health()).status).toBe("degraded");
    adapter.available = false;
    expect(await adapter.health()).toEqual(
      expect.objectContaining({
        status: "unavailable",
        supportsAutomaticRenewal: true,
        supportsKeylessCustody: true,
      }),
    );
  });

  it("binds DNS proof through issue, activation, renewal, and revocation", async () => {
    const { adapter, request, values } = fixture();
    const issued = await adapter.issue(request);

    expect(issued.dnsVerificationReference).toBe(values.dnsReference);
    expect(issued.status).toBe("issuing");
    expect(
      await adapter.status({
        reference: issued.reference,
        scope: values.scope,
      }),
    ).toEqual(issued);
    await expect(
      adapter.renew({
        expectedRevision: issued.revision,
        reference: issued.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "not-ready", operation: "renew" });

    const expiry = EpochMilliseconds.parse(10_000);
    adapter.activateForTest(issued.reference, expiry);
    const active = await adapter.status({ reference: issued.reference, scope: values.scope });
    expect(active).toEqual(
      expect.objectContaining({
        expiresAt: expiry,
        issuedAt: values.clock.now(),
        status: "active",
      }),
    );

    const renewing = await adapter.renew({
      expectedRevision: issued.revision,
      reference: issued.reference,
      scope: values.scope,
    });
    expect(renewing.status).toBe("renewing");
    expect(renewing.revision.numberValue()).toBe(2);
    const revoked = await adapter.revoke({
      expectedRevision: renewing.revision,
      reference: issued.reference,
      scope: values.scope,
    });
    expect(revoked.status).toBe("revoked");
    expect(revoked.revision.numberValue()).toBe(3);
  });

  it("rejects collisions, stale revisions, missing records, and cross-tenant access", async () => {
    const { adapter, request, values } = fixture();
    const issued = await adapter.issue(request);

    await expect(adapter.issue(request)).rejects.toMatchObject({
      code: "conflict",
      operation: "issue",
    });
    await expect(
      adapter.renew({
        expectedRevision: AutomationRevision.parse(2),
        reference: issued.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "renew" });
    await expect(
      adapter.revoke({
        expectedRevision: AutomationRevision.parse(2),
        reference: issued.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "revoke" });

    const missing = DomainAutomationReference.parse("test:certificate/missing");
    for (const [operation, action] of [
      [
        "renew",
        () =>
          adapter.renew({
            expectedRevision: issued.revision,
            reference: missing,
            scope: values.scope,
          }),
      ],
      [
        "revoke",
        () =>
          adapter.revoke({
            expectedRevision: issued.revision,
            reference: issued.reference,
            scope: managedScope("040506070899"),
          }),
      ],
    ] as const) {
      await expect(action()).rejects.toMatchObject({ code: "not-found", operation });
    }
    expect(
      await adapter.status({
        reference: issued.reference,
        scope: managedScope("040506070899"),
      }),
    ).toBeUndefined();
    expect(() => adapter.activateForTest(missing, EpochMilliseconds.parse(2_000))).toThrow(
      expect.objectContaining({ code: "not-found" }),
    );

    const afterRevocation = await adapter.revoke({
      expectedRevision: issued.revision,
      reference: issued.reference,
      scope: values.scope,
    });
    expect(afterRevocation.status).toBe("revoked");
    expect(
      (
        await adapter.issue({
          ...request,
          hostname: ManagedHostname.parse("login.example.com"),
        })
      ).status,
    ).toBe("issuing");
  });

  it("normalizes dependency outages for every operation", async () => {
    const { adapter, request, values } = fixture();
    const issued = await adapter.issue(request);
    adapter.available = false;

    for (const [operation, action] of [
      [
        "issue",
        () => adapter.issue({ ...request, hostname: ManagedHostname.parse("x.example.com") }),
      ],
      [
        "renew",
        () =>
          adapter.renew({
            expectedRevision: issued.revision,
            reference: issued.reference,
            scope: values.scope,
          }),
      ],
      [
        "revoke",
        () =>
          adapter.revoke({
            expectedRevision: issued.revision,
            reference: issued.reference,
            scope: values.scope,
          }),
      ],
      ["status", () => adapter.status({ reference: issued.reference, scope: values.scope })],
    ] as const) {
      await expect(action()).rejects.toMatchObject({ code: "unavailable", operation });
    }
  });
});
