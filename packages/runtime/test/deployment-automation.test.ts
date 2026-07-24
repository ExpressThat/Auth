import { describe, expect, it } from "vitest";
import {
  AutomationRevision,
  DomainAutomationReference,
  FrontendArtifactDigest,
  FrontendArtifactReference,
  ManagedHostname,
} from "../src/index.js";
import { TestFrontendDeploymentAdapter } from "../src/testing.js";
import { managedDomainFixture } from "./managed-domain-test-fixture.js";

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

describe("deterministic frontend deployment adapter", () => {
  it("reports health and immutable activation capabilities", async () => {
    const { adapter } = fixture();

    expect((await adapter.health()).status).toBe("healthy");
    adapter.degraded = true;
    expect((await adapter.health()).status).toBe("degraded");
    adapter.available = false;
    expect(await adapter.health()).toEqual(
      expect.objectContaining({
        status: "unavailable",
        supportsAtomicActivation: true,
        supportsRollback: true,
      }),
    );
  });

  it("deploys verified artifacts, updates atomically, rolls back, and removes", async () => {
    const { adapter, request, values } = fixture();
    const created = await adapter.deploy(request);

    expect(created).toEqual(
      expect.objectContaining({
        certificateReference: values.certificateReference,
        status: "deploying",
      }),
    );
    expect(
      await adapter.status({
        reference: created.reference,
        scope: values.scope,
      }),
    ).toEqual(created);
    await expect(
      adapter.verify({
        expectedRevision: created.revision,
        reference: created.reference,
        scope: values.scope,
      }),
    ).rejects.toMatchObject({ code: "not-ready", operation: "verify" });

    adapter.activateForTest(created.reference);
    const active = await adapter.verify({
      expectedRevision: created.revision,
      reference: created.reference,
      scope: values.scope,
    });
    expect(active).toEqual(
      expect.objectContaining({
        deployedAt: values.clock.now(),
        status: "active",
      }),
    );

    const secondCertificate = DomainAutomationReference.parse("test:certificate/cert-2");
    const updated = await adapter.deploy({
      ...request,
      artifactDigest: FrontendArtifactDigest.sha256(`sha256:${"b".repeat(64)}`),
      artifactReference: FrontendArtifactReference.parse("object:artifact/frontend-v2"),
      certificateReference: secondCertificate,
      expectedRevision: active.revision,
    });
    expect(updated).toEqual(
      expect.objectContaining({
        certificateReference: secondCertificate,
        status: "deploying",
      }),
    );
    adapter.activateForTest(updated.reference);

    const rollback = await adapter.rollback({
      expectedRevision: updated.revision,
      reference: updated.reference,
      scope: values.scope,
      targetRevision: created.revision,
    });
    expect(rollback).toEqual(
      expect.objectContaining({
        artifactReference: request.artifactReference,
        status: "rolling-back",
      }),
    );
    expect(rollback).not.toHaveProperty("deployedAt");

    const removed = await adapter.remove({
      expectedRevision: rollback.revision,
      reference: rollback.reference,
      scope: values.scope,
    });
    expect(removed.status).toBe("removed");
    expect(removed.revision.numberValue()).toBe(4);
  });

  it("enforces optimistic creation, replacement, and removed-host conflicts", async () => {
    const { adapter, request, values } = fixture();

    await expect(
      adapter.deploy({
        ...request,
        expectedRevision: AutomationRevision.parse(1),
        hostname: ManagedHostname.parse("new.example.com"),
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "deploy" });

    const created = await adapter.deploy(request);
    await expect(adapter.deploy(request)).rejects.toMatchObject({
      code: "conflict",
      operation: "deploy",
    });
    await expect(
      adapter.deploy({
        ...request,
        expectedRevision: AutomationRevision.parse(2),
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "deploy" });

    const removed = await adapter.remove({
      expectedRevision: created.revision,
      reference: created.reference,
      scope: values.scope,
    });
    await expect(
      adapter.deploy({
        ...request,
        expectedRevision: removed.revision,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "deploy" });
  });
});
