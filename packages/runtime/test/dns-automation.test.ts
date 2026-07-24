import { describe, expect, it } from "vitest";
import {
  AutomationRevision,
  DomainAutomationReference,
  EpochMilliseconds,
  ManagedHostname,
} from "../src/index.js";
import { TestDnsAutomationAdapter } from "../src/testing.js";
import { managedDomainFixture, managedScope } from "./managed-domain-test-fixture.js";

function fixture() {
  const values = managedDomainFixture();
  return {
    adapter: new TestDnsAutomationAdapter(values.clock),
    request: {
      challenge: values.challenge,
      challengeExpiresAt: values.challengeExpiresAt,
      challengeRecord: values.challengeRecord,
      hostname: values.hostname,
      routingTarget: values.routingTarget,
      scope: values.scope,
    },
    values,
  };
}

describe("deterministic DNS automation adapter", () => {
  it("reports dependency health without probing through domain state", async () => {
    const { adapter } = fixture();

    expect((await adapter.health()).status).toBe("healthy");
    adapter.degraded = true;
    expect((await adapter.health()).status).toBe("degraded");
    adapter.available = false;
    expect(await adapter.health()).toEqual(
      expect.objectContaining({
        status: "unavailable",
        supportsOwnershipVerification: true,
        supportsRoutingVerification: true,
      }),
    );
  });

  it("prepares, verifies, expires, and removes a scoped ownership challenge", async () => {
    const { adapter, request, values } = fixture();
    const plan = await adapter.prepare(request);

    expect(plan.reference.toJSON()).toContain("REDACTED");
    expect(plan.revision.numberValue()).toBe(1);
    expect(
      (
        await adapter.verify({
          expectedRevision: plan.revision,
          reference: plan.reference,
          scope: values.scope,
        })
      ).status,
    ).toBe("pending");

    adapter.setStatusForTest(plan.reference, "verified");
    expect(
      (
        await adapter.verify({
          expectedRevision: plan.revision,
          reference: plan.reference,
          scope: values.scope,
        })
      ).status,
    ).toBe("verified");

    values.clock.set(2_000);
    expect(
      (
        await adapter.verify({
          expectedRevision: plan.revision,
          reference: plan.reference,
          scope: values.scope,
        })
      ).status,
    ).toBe("expired");

    const removed = await adapter.remove({
      expectedRevision: plan.revision,
      reference: plan.reference,
      scope: values.scope,
    });
    expect(removed.revision.numberValue()).toBe(2);
    await expect(
      adapter.verify({
        expectedRevision: removed.revision,
        reference: plan.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "not-found", operation: "verify" });
  });

  it("rejects expired, colliding, stale, missing, and cross-tenant operations", async () => {
    const { adapter, request, values } = fixture();
    const plan = await adapter.prepare(request);

    await expect(adapter.prepare(request)).rejects.toMatchObject({
      code: "conflict",
      operation: "prepare",
    });
    await expect(
      adapter.prepare({
        ...request,
        challengeExpiresAt: EpochMilliseconds.parse(1_000),
        hostname: ManagedHostname.parse("expired.example.com"),
      }),
    ).rejects.toMatchObject({ code: "expired", operation: "prepare" });
    await expect(
      adapter.verify({
        expectedRevision: AutomationRevision.parse(2),
        reference: plan.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "verify" });
    await expect(
      adapter.remove({
        expectedRevision: AutomationRevision.parse(2),
        reference: plan.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "remove" });

    for (const [operation, action] of [
      [
        "verify",
        () =>
          adapter.verify({
            expectedRevision: plan.revision,
            reference: plan.reference,
            scope: managedScope("040506070899"),
          }),
      ],
      [
        "remove",
        () =>
          adapter.remove({
            expectedRevision: plan.revision,
            reference: plan.reference,
            scope: managedScope("040506070899"),
          }),
      ],
    ] as const) {
      await expect(action()).rejects.toMatchObject({ code: "not-found", operation });
    }
    expect(() =>
      adapter.setStatusForTest(DomainAutomationReference.parse("test:dns/missing"), "verified"),
    ).toThrow(expect.objectContaining({ code: "not-found" }));
  });

  it("normalizes outages for every mutating and observation operation", async () => {
    const { adapter, request, values } = fixture();
    const plan = await adapter.prepare(request);
    adapter.available = false;

    for (const [operation, action] of [
      [
        "prepare",
        () =>
          adapter.prepare({
            ...request,
            hostname: ManagedHostname.parse("other.example.com"),
          }),
      ],
      [
        "verify",
        () =>
          adapter.verify({
            expectedRevision: plan.revision,
            reference: plan.reference,
            scope: values.scope,
          }),
      ],
      [
        "remove",
        () =>
          adapter.remove({
            expectedRevision: plan.revision,
            reference: plan.reference,
            scope: values.scope,
          }),
      ],
    ] as const) {
      await expect(action()).rejects.toMatchObject({
        code: "unavailable",
        operation,
        retryable: true,
      });
    }
  });
});
