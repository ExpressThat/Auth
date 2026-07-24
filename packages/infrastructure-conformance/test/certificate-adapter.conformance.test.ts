import { DomainAutomationReference, ManagedHostname } from "@expressthat-auth/runtime";
import { TestCertificateAutomationAdapter } from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineCertificateConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";
import { domainValues, managedScope } from "./managed-domain-conformance-fixture.js";

function fixture() {
  const values = domainValues();
  return {
    adapter: new TestCertificateAutomationAdapter(values.clock),
    request: {
      dnsVerificationReference: values.dnsReference,
      hostname: ManagedHostname.parse("login.example.com"),
      scope: values.scope,
    },
    values,
  };
}

describe("deterministic certificate adapter conformance", () => {
  it("passes every certificate automation conformance axis", async () => {
    const suite = defineCertificateConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, request } = fixture();
          return Promise.allSettled(
            ["one", "two", "three"].map((label) =>
              adapter.issue({
                ...request,
                hostname: ManagedHostname.parse(`${label}.example.com`),
              }),
            ),
          );
        },
        failure: async () => {
          const { adapter, request } = fixture();
          await adapter.issue(request);
          return adapter.issue(request);
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
            await adapter.issue({
              ...request,
              dnsVerificationReference: DomainAutomationReference.parse(
                `test:certificate/${conformanceCanary()}`,
              ),
            });
          } catch (error: unknown) {
            return error;
          }
          throw new Error("Expected certificate automation failure.");
        },
        residency: async () => {
          const { adapter, request } = fixture();
          const issued = await adapter.issue(request);
          expect(
            await adapter.status({
              reference: issued.reference,
              scope: managedScope("040506070899"),
            }),
          ).toBeUndefined();
        },
        retry: async () => {
          const { adapter, request } = fixture();
          adapter.available = false;
          return adapter.issue(request);
        },
        success: async () => {
          const { adapter, request, values } = fixture();
          const issued = await adapter.issue(request);
          adapter.activateForTest(issued.reference, values.expiresAt);
          const renewing = await adapter.renew({
            expectedRevision: issued.revision,
            reference: issued.reference,
            scope: values.scope,
          });
          expect(renewing.status).toBe("renewing");
        },
      }),
      2_000,
    );

    expect((await suite.run()).results).toHaveLength(9);
  });
});
