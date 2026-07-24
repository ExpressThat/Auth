import { describe, expect, it } from "vitest";
import {
  CacheKey,
  CachePolicyVersion,
  CachePurpose,
  CacheScope,
  CacheValue,
  CacheVersion,
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
} from "../src/index.js";
import { ControlledClock, TestCacheBackend, TestCacheStateAdapter } from "../src/testing.js";

const entity = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
  PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));

function fixture() {
  const clock = new ControlledClock(1_000);
  const backend = new TestCacheBackend();
  const adapter = new TestCacheStateAdapter(clock, backend);
  const scope = CacheScope.create({
    applicationId: entity("app", "040506070803"),
    customerOrganisationId: entity("org", "040506070801"),
    environmentId: entity("env", "040506070802"),
    policyVersion: CachePolicyVersion.parse(1),
    purpose: CachePurpose.parse("session.lookup"),
  });
  return { adapter, backend, clock, key: CacheKey.create(scope, "subject/one") };
}

const future = () => EpochMilliseconds.parse(2_000);
const value = (text: string) => CacheValue.fromBytes(new TextEncoder().encode(text));
const policy = "query-authoritative-source" as const;

describe("cache state contract", () => {
  it("puts, retrieves, overwrites, and defensively copies shared state", async () => {
    const { adapter, backend, clock, key } = fixture();
    const replica = new TestCacheStateAdapter(clock, backend);
    const first = await adapter.put({
      expiresAt: future(),
      failurePolicy: policy,
      key,
      value: value("one"),
    });
    const returnedCopy = first.value.copyForProvider();
    returnedCopy[0] = 0;
    const second = await replica.put({
      expiresAt: future(),
      failurePolicy: policy,
      key,
      value: value("two"),
    });

    expect(first.version.numberValue()).toBe(1);
    expect(second.version.numberValue()).toBe(2);
    const found = await adapter.get({ failurePolicy: policy, key });
    expect(new TextDecoder().decode(found?.value.copyForProvider())).toBe("two");
  });

  it("treats the exact expiry instant as absent", async () => {
    const { adapter, clock, key } = fixture();
    await adapter.put({
      expiresAt: EpochMilliseconds.parse(1_001),
      failurePolicy: policy,
      key,
      value: value("short"),
    });
    clock.advance(1);

    await expect(adapter.get({ failurePolicy: policy, key })).resolves.toBeUndefined();
    await expect(
      adapter.put({
        expiresAt: EpochMilliseconds.parse(1_001),
        failurePolicy: policy,
        key,
        value: value("expired"),
      }),
    ).rejects.toMatchObject({ code: "expired", operation: "put" });
  });

  it("compares and sets atomically with explicit outcomes", async () => {
    const { adapter, key } = fixture();
    await expect(
      adapter.compareAndSet({
        expectedVersion: CacheVersion.parse(1),
        expiresAt: future(),
        failurePolicy: "deny-request",
        key,
        value: value("missing"),
      }),
    ).resolves.toEqual({ outcome: "not-found" });
    await adapter.put({ expiresAt: future(), failurePolicy: policy, key, value: value("one") });
    await expect(
      adapter.compareAndSet({
        expectedVersion: CacheVersion.parse(2),
        expiresAt: future(),
        failurePolicy: "deny-request",
        key,
        value: value("stale"),
      }),
    ).resolves.toEqual({ outcome: "version-mismatch" });
    const updated = await adapter.compareAndSet({
      expectedVersion: CacheVersion.parse(1),
      expiresAt: future(),
      failurePolicy: "deny-request",
      key,
      value: value("two"),
    });
    expect(updated.outcome).toBe("applied");
    expect(updated.entry?.version.numberValue()).toBe(2);
  });

  it("increments and expires counters atomically across replicas", async () => {
    const { adapter, backend, clock, key } = fixture();
    const replica = new TestCacheStateAdapter(clock, backend);
    const first = await adapter.increment({
      delta: 1,
      expiresAt: EpochMilliseconds.parse(1_001),
      failurePolicy: "deny-request",
      initialValue: 0,
      key,
    });
    const second = await replica.increment({
      delta: 2,
      expiresAt: EpochMilliseconds.parse(1_001),
      failurePolicy: "deny-request",
      initialValue: 0,
      key,
    });
    expect([first.value, second.value]).toEqual([1, 3]);
    expect(second.version.numberValue()).toBe(2);
    clock.advance(1);
    const restarted = await adapter.increment({
      delta: 1,
      expiresAt: future(),
      failurePolicy: "deny-request",
      initialValue: 10,
      key,
    });
    expect(restarted.value).toBe(11);
  });

  it("deletes byte and counter state with optional optimistic versions", async () => {
    const { adapter, key } = fixture();
    await expect(adapter.delete({ failurePolicy: "reject-operation", key })).resolves.toEqual({
      outcome: "not-found",
    });
    await adapter.put({ expiresAt: future(), failurePolicy: policy, key, value: value("one") });
    await expect(
      adapter.delete({
        expectedVersion: CacheVersion.parse(2),
        failurePolicy: "reject-operation",
        key,
      }),
    ).resolves.toEqual({ outcome: "version-mismatch" });
    const deleted = await adapter.delete({
      expectedVersion: CacheVersion.parse(1),
      failurePolicy: "reject-operation",
      key,
    });
    expect(deleted.outcome).toBe("applied");
    expect(new TextDecoder().decode(deleted.entry?.value.copyForProvider())).toBe("one");

    await adapter.increment({
      delta: 1,
      expiresAt: future(),
      failurePolicy: "deny-request",
      initialValue: 0,
      key,
    });
    await expect(adapter.delete({ failurePolicy: "deny-request", key })).resolves.toEqual({
      outcome: "applied",
    });
  });

  it("reports healthy, degraded, and unavailable atomic capability", async () => {
    const { adapter, backend } = fixture();
    await expect(adapter.health()).resolves.toMatchObject({
      checkedAt: EpochMilliseconds.parse(1_000),
      status: "healthy",
      supportsAtomicOperations: true,
    });
    backend.degraded = true;
    await expect(adapter.health()).resolves.toMatchObject({ status: "degraded" });
    backend.available = false;
    await expect(adapter.health()).resolves.toMatchObject({ status: "unavailable" });
  });

  it("does not expose counters through the byte lookup contract", async () => {
    const { adapter, key } = fixture();
    await adapter.increment({
      delta: 1,
      expiresAt: future(),
      failurePolicy: "deny-request",
      initialValue: 0,
      key,
    });
    await expect(adapter.get({ failurePolicy: policy, key })).resolves.toBeUndefined();
  });
});
