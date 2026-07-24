import { FrontendArtifactReference, ManagedHostname } from "@expressthat-auth/runtime";
import { TestFrontendDeploymentAdapter } from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineDeploymentConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";
import { domainValues, managedScope } from "./managed-domain-conformance-fixture.js";

function fixture() {
  const values = domainValues();
  return {
    adapter: new TestFrontendDeploymentAdapter(values.clock),
    request: {
      artifactDigest: values.artifactDigest,
      artifactReference: values.artifactReference,
      certificateReference: values.certificateReference,
      hostname: ManagedHostname.parse("login.example.com"),
      scope: values.scope,
    },
    values,
  };
}

describe("deterministic deployment adapter conformance", () => {
  it("passes every frontend deployment conformance axis", async () => {
    const suite = defineDeploymentConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, request } = fixture();
          return Promise.allSettled(
            ["one", "two", "three"].map((label) =>
              adapter.deploy({
                ...request,
                hostname: ManagedHostname.parse(`${label}.example.com`),
              }),
            ),
          );
        },
        failure: async () => {
          const { adapter, request } = fixture();
          await adapter.deploy(request);
          return adapter.deploy(request);
        },
        health: async () => {
          const { adapter } = fixture();
          expect((await adapter.health()).status).toBe("healthy");
          adapter.available = false;
          expect((await adapter.health()).status).toBe("unavailable");
        },
        redaction: async () => {
          const { adapter, request } = fixture();
          adapter.available = false;
          try {
            await adapter.deploy({
              ...request,
              artifactReference: FrontendArtifactReference.parse(
                `object:artifact/${conformanceCanary()}`,
              ),
            });
          } catch (error: unknown) {
            return error;
          }
          throw new Error("Expected frontend deployment failure.");
        },
        residency: async () => {
          const { adapter, request } = fixture();
          const deployment = await adapter.deploy(request);
          expect(
            await adapter.status({
              reference: deployment.reference,
              scope: managedScope("040506070899"),
            }),
          ).toBeUndefined();
        },
        retry: async () => {
          const { adapter, request } = fixture();
          adapter.available = false;
          return adapter.deploy(request);
        },
        success: async () => {
          const { adapter, request, values } = fixture();
          const deployment = await adapter.deploy(request);
          adapter.activateForTest(deployment.reference);
          expect(
            (
              await adapter.verify({
                expectedRevision: deployment.revision,
                reference: deployment.reference,
                scope: values.scope,
              })
            ).status,
          ).toBe("active");
        },
      }),
      2_000,
    );

    expect((await suite.run()).results).toHaveLength(9);
  });
});
