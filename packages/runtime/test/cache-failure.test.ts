import { describe, expect, it } from "vitest";
import {
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  CacheStateError,
  CacheValue,
  CacheVersion,
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
} from "../src/index.js";
import { ControlledClock } from "../src/testing.js";
import { TestCacheBackend, TestCacheStateAdapter } from "./cache-test-adapter.js";

function fixture() {
  const clock = new ControlledClock(1_000);
  const backend = new TestCacheBackend();
  const adapter = new TestCacheStateAdapter(clock, backend);
  const id = EntityId.parse("01234567-89ab-7001-8203-040506070801");
  const scope = CacheScope.create({
    customerOrganisationId: PublicEntityId.create("org", id),
    environmentId: PublicEntityId.create("env", id),
    policyVersion: CachePolicyVersion.parse(1),
    purpose: CachePurpose.parse("failure.tests"),
  });
  return { adapter, backend, key: CacheKey.create(scope, "subject/one") };
}

const future = () => EpochMilliseconds.parse(2_000);
const value = (text: string) => CacheValue.fromBytes(new TextEncoder().encode(text));

describe("cache failure contract", () => {
  it("normalizes outages and never includes keys or values in errors", async () => {
    const { adapter, backend, key } = fixture();
    backend.available = false;
    const operations = [
      adapter.get({ failurePolicy: "deny-request", key }),
      adapter.put({
        expiresAt: future(),
        failurePolicy: "query-authoritative-source",
        key,
        value: value("canary"),
      }),
      adapter.increment({
        delta: 1,
        expiresAt: future(),
        failurePolicy: "deny-request",
        initialValue: 0,
        key,
      }),
      adapter.compareAndSet({
        expectedVersion: CacheVersion.parse(1),
        expiresAt: future(),
        failurePolicy: "reject-operation",
        key,
        value: value("canary"),
      }),
      adapter.delete({ failurePolicy: "reject-operation", key }),
    ];

    for (const operation of operations) {
      await expect(operation).rejects.toMatchObject({ code: "unavailable", retryable: true });
    }
    const error = new CacheStateError("get", "unavailable");
    expect(JSON.stringify(error)).toBe('{"code":"unavailable","operation":"get","retryable":true}');
    expect(error.message).not.toContain(key.providerKey());
    expect(new CacheStateError("put", "invalid").retryable).toBe(false);
  });

  it("rejects invalid counters, overflow, conflicts, and expired mutations", async () => {
    const { adapter, key } = fixture();
    const increment = (delta: number, initialValue = 0) =>
      adapter.increment({
        delta,
        expiresAt: future(),
        failurePolicy: "deny-request",
        initialValue,
        key,
      });
    await expect(increment(0.5)).rejects.toMatchObject({ code: "invalid" });
    await expect(increment(1, 0.5)).rejects.toMatchObject({ code: "invalid" });
    await expect(increment(1, Number.MAX_SAFE_INTEGER)).rejects.toMatchObject({
      code: "overflow",
    });

    await adapter.put({
      expiresAt: future(),
      failurePolicy: "query-authoritative-source",
      key,
      value: value("bytes"),
    });
    await expect(increment(1)).rejects.toMatchObject({ code: "conflict" });
    await expect(
      adapter.increment({
        delta: 1,
        expiresAt: EpochMilliseconds.parse(1_000),
        failurePolicy: "deny-request",
        initialValue: 0,
        key,
      }),
    ).rejects.toMatchObject({ code: "expired" });
    await expect(
      adapter.compareAndSet({
        expectedVersion: CacheVersion.parse(1),
        expiresAt: EpochMilliseconds.parse(1_000),
        failurePolicy: "reject-operation",
        key,
        value: value("expired"),
      }),
    ).rejects.toMatchObject({ code: "expired" });
  });
});
