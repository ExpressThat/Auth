import { describe, expect, it } from "vitest";
import { AutomationRevision, DomainAutomationReference } from "../src/index.js";
import { TestFrontendDeploymentAdapter } from "../src/testing.js";
import { managedDomainFixture, managedScope } from "./managed-domain-test-fixture.js";

function fixture() {
  const values = managedDomainFixture();
  return {
    adapter: new TestFrontendDeploymentAdapter(values.clock),
    request: {
      artifactDigest: values.artifactDigest,
      artifactReference: values.artifactReference,
      certificateReference: values.certificateReference,
      hostname: values.hostname,
      scope: values.scope,
    },
    values,
  };
}

describe("frontend deployment failure behavior", () => {
  it("rejects stale, missing, cross-tenant, and invalid rollback operations", async () => {
    const { adapter, request, values } = fixture();
    const created = await adapter.deploy(request);
    const missing = DomainAutomationReference.parse("test:deployment/missing");

    for (const [operation, action] of [
      [
        "verify",
        () =>
          adapter.verify({
            expectedRevision: AutomationRevision.parse(2),
            reference: created.reference,
            scope: values.scope,
          }),
      ],
      [
        "remove",
        () =>
          adapter.remove({
            expectedRevision: AutomationRevision.parse(2),
            reference: created.reference,
            scope: values.scope,
          }),
      ],
      [
        "rollback",
        () =>
          adapter.rollback({
            expectedRevision: AutomationRevision.parse(2),
            reference: created.reference,
            scope: values.scope,
            targetRevision: created.revision,
          }),
      ],
    ] as const) {
      await expect(action()).rejects.toMatchObject({ code: "conflict", operation });
    }
    await expect(
      adapter.verify({
        expectedRevision: created.revision,
        reference: missing,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "not-found", operation: "verify" });
    await expect(
      adapter.remove({
        expectedRevision: created.revision,
        reference: created.reference,
        scope: managedScope("040506070899"),
      }),
    ).rejects.toMatchObject({ code: "not-found", operation: "remove" });
    expect(
      await adapter.status({
        reference: created.reference,
        scope: managedScope("040506070899"),
      }),
    ).toBeUndefined();
    expect(() => adapter.activateForTest(missing)).toThrow(
      expect.objectContaining({ code: "not-found" }),
    );

    const updated = await adapter.deploy({ ...request, expectedRevision: created.revision });
    await expect(
      adapter.rollback({
        expectedRevision: updated.revision,
        reference: updated.reference,
        scope: values.scope,
        targetRevision: created.revision,
      }),
    ).rejects.toMatchObject({ code: "not-found", operation: "rollback" });
  });

  it("normalizes dependency outages for every operation", async () => {
    const { adapter, request, values } = fixture();
    const created = await adapter.deploy(request);
    adapter.available = false;

    for (const [operation, action] of [
      ["deploy", () => adapter.deploy({ ...request, expectedRevision: created.revision })],
      [
        "remove",
        () =>
          adapter.remove({
            expectedRevision: created.revision,
            reference: created.reference,
            scope: values.scope,
          }),
      ],
      [
        "rollback",
        () =>
          adapter.rollback({
            expectedRevision: created.revision,
            reference: created.reference,
            scope: values.scope,
            targetRevision: created.revision,
          }),
      ],
      ["status", () => adapter.status({ reference: created.reference, scope: values.scope })],
      [
        "verify",
        () =>
          adapter.verify({
            expectedRevision: created.revision,
            reference: created.reference,
            scope: values.scope,
          }),
      ],
    ] as const) {
      await expect(action()).rejects.toMatchObject({ code: "unavailable", operation });
    }
  });
});
