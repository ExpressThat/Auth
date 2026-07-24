import {
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  CacheValue,
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
} from "@expressthat-auth/runtime";
import {
  ControlledClock,
  TestCacheBackend,
  TestCacheStateAdapter,
} from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineCacheConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";

const policy = "query-authoritative-source" as const;

function keyFor(organisationSuffix: string): CacheKey {
  const entity = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
    PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));
  return CacheKey.create(
    CacheScope.create({
      applicationId: entity("app", "040506070803"),
      customerOrganisationId: entity("org", organisationSuffix),
      environmentId: entity("env", "040506070802"),
      policyVersion: CachePolicyVersion.parse(1),
      purpose: CachePurpose.parse("session.lookup"),
    }),
    "subject/one",
  );
}

function fixture() {
  const clock = new ControlledClock(1_000);
  const backend = new TestCacheBackend();
  return {
    adapter: new TestCacheStateAdapter(clock, backend),
    backend,
    key: keyFor("040506070801"),
  };
}

const request = (key: CacheKey, value = "value") => ({
  expiresAt: EpochMilliseconds.parse(2_000),
  failurePolicy: policy,
  key,
  value: CacheValue.fromBytes(new TextEncoder().encode(value)),
});

describe("deterministic cache adapter conformance", () => {
  it("passes every cache conformance axis", async () => {
    const suite = defineCacheConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, key } = fixture();
          return Promise.allSettled(
            [1, 2, 3].map((delta) =>
              adapter.increment({
                delta,
                expiresAt: EpochMilliseconds.parse(2_000),
                failurePolicy: "deny-request",
                initialValue: 0,
                key,
              }),
            ),
          );
        },
        failure: async () => {
          const { adapter, key } = fixture();
          return adapter.put({ ...request(key), expiresAt: EpochMilliseconds.parse(1_000) });
        },
        health: async () => {
          const { adapter, backend } = fixture();
          expect((await adapter.health()).status).toBe("healthy");
          backend.available = false;
          expect((await adapter.health()).status).toBe("unavailable");
        },
        redaction: async () => {
          const { adapter, backend, key } = fixture();
          backend.available = false;
          try {
            await adapter.put(request(key, conformanceCanary()));
          } catch (error: unknown) {
            return error;
          }
          throw new Error("Expected cache failure.");
        },
        residency: async () => {
          const { adapter } = fixture();
          await adapter.put(request(keyFor("040506070801"), "first"));
          expect(await adapter.get({ failurePolicy: policy, key: keyFor("040506070899") })).toBe(
            undefined,
          );
        },
        retry: async () => {
          const { adapter, backend, key } = fixture();
          backend.available = false;
          return adapter.get({ failurePolicy: policy, key });
        },
        success: async () => {
          const { adapter, key } = fixture();
          await adapter.put(request(key));
          expect(await adapter.get({ failurePolicy: policy, key })).toBeDefined();
        },
      }),
      2_000,
    );

    expect((await suite.run()).results).toHaveLength(9);
  });
});
