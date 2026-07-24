import {
  DnsRecordName,
  DomainChallengeValue,
  EpochMilliseconds,
  ManagedHostname,
} from "@expressthat-auth/runtime";
import { TestDnsAutomationAdapter } from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineDnsConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";
import { domainValues, managedScope } from "./managed-domain-conformance-fixture.js";

function fixture() {
  const values = domainValues();
  const adapter = new TestDnsAutomationAdapter(values.clock);
  const request = {
    challenge: values.challenge,
    challengeExpiresAt: EpochMilliseconds.parse(2_000),
    challengeRecord: DnsRecordName.parse("_auth.login.example.com"),
    hostname: ManagedHostname.parse("login.example.com"),
    routingTarget: ManagedHostname.parse("edge.example.net"),
    scope: values.scope,
  };
  return { adapter, request, values };
}

describe("deterministic DNS adapter conformance", () => {
  it("passes every DNS automation conformance axis", async () => {
    const suite = defineDnsConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, request } = fixture();
          return Promise.allSettled(
            ["one", "two", "three"].map((label) =>
              adapter.prepare({
                ...request,
                challengeRecord: DnsRecordName.parse(`_${label}.login.example.com`),
                hostname: ManagedHostname.parse(`${label}.example.com`),
              }),
            ),
          );
        },
        failure: async () => {
          const { adapter, request } = fixture();
          return adapter.prepare({
            ...request,
            challengeExpiresAt: EpochMilliseconds.parse(1_000),
          });
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
            await adapter.prepare({
              ...request,
              challenge: DomainChallengeValue.parse(`${conformanceCanary()}${"a".repeat(32)}`),
            });
          } catch (error: unknown) {
            return error;
          }
          throw new Error("Expected DNS automation failure.");
        },
        residency: async () => {
          const { adapter, request } = fixture();
          const plan = await adapter.prepare(request);
          await expect(
            adapter.verify({
              expectedRevision: plan.revision,
              reference: plan.reference,
              scope: managedScope("040506070899"),
            }),
          ).rejects.toMatchObject({ code: "not-found" });
        },
        retry: async () => {
          const { adapter, request } = fixture();
          adapter.available = false;
          return adapter.prepare(request);
        },
        success: async () => {
          const { adapter, request, values } = fixture();
          const plan = await adapter.prepare(request);
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
        },
      }),
      2_000,
    );

    expect((await suite.run()).results).toHaveLength(9);
  });
});
