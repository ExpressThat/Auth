import { describe, expect, it } from "vitest";
import { EpochMilliseconds, ObjectKey, ObjectStorageError } from "../src/index.js";
import { TestObjectBackend, TestObjectStorageAdapter } from "../src/testing.js";
import { objectFixture, objectSignedWrite, objectWrite } from "./object-test-fixture.js";

describe("object storage policy, health, and failures", () => {
  it("enforces classification, expiry, and selected residency", async () => {
    const { adapter, scope } = objectFixture("operator-managed");
    await expect(adapter.put(await objectWrite(scope))).rejects.toMatchObject({
      code: "residency-violation",
    });
    await expect(
      adapter.put(
        await objectWrite(scope, {
          classifications: [],
          requiredResidency: "operator-managed",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.put(
        await objectWrite(scope, {
          classifications: ["personal", "personal"],
          key: ObjectKey.parse("invalid/duplicate"),
          requiredResidency: "operator-managed",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.put(
        await objectWrite(scope, {
          expiresAt: EpochMilliseconds.parse(1_000),
          key: ObjectKey.parse("invalid/expiry"),
          requiredResidency: "operator-managed",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.put(
        await objectWrite(scope, {
          key: ObjectKey.parse("operator/accepted"),
          requiredResidency: "operator-managed",
        }),
      ),
    ).resolves.toMatchObject({
      residency: { policy: "operator-managed" },
    });
  });

  it("reports healthy, degraded, and unavailable capabilities", async () => {
    const { adapter, scope } = objectFixture();
    await expect(adapter.health()).resolves.toEqual({
      checkedAt: EpochMilliseconds.parse(1_000),
      status: "healthy",
      supportsChecksums: true,
      supportsSignedAccess: true,
      supportsVersioning: true,
    });
    const request = await objectWrite(scope);
    await adapter.put(request);
    await expect(adapter.get({ key: request.key, scope })).resolves.toBeDefined();
  });

  it("binds signed writes to classification, expiry, and residency policy", async () => {
    const { adapter, scope } = objectFixture("operator-managed");
    await expect(
      adapter.signAccess(await objectSignedWrite(scope, EpochMilliseconds.parse(2_000))),
    ).rejects.toMatchObject({ code: "residency-violation" });
    await expect(
      adapter.signAccess(
        await objectSignedWrite(scope, EpochMilliseconds.parse(2_000), {
          classifications: [],
          requiredResidency: "operator-managed",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.signAccess(
        await objectSignedWrite(scope, EpochMilliseconds.parse(2_000), {
          objectExpiresAt: EpochMilliseconds.parse(1_000),
          requiredResidency: "operator-managed",
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("normalizes provider outages and redacts errors", async () => {
    const { clock, residency, scope } = objectFixture();
    const backend = new TestObjectBackend();
    const adapter = new TestObjectStorageAdapter(clock, residency, backend);
    const request = await objectWrite(scope);
    const metadata = await adapter.put(request);
    backend.degraded = true;
    await expect(adapter.health()).resolves.toMatchObject({ status: "degraded" });
    backend.available = false;
    await expect(adapter.health()).resolves.toMatchObject({ status: "unavailable" });
    const outagePut = await objectWrite(scope, { key: ObjectKey.parse("outage/put") });
    const operations = [
      () => adapter.get({ key: request.key, scope }),
      () => adapter.put(outagePut),
      () =>
        adapter.delete({
          expectedVersion: metadata.version,
          key: request.key,
          scope,
        }),
      () =>
        adapter.signAccess({
          accessExpiresAt: EpochMilliseconds.parse(2_000),
          action: "read" as const,
          key: request.key,
          scope,
        }),
    ];
    for (const operation of operations) {
      await expect(operation()).rejects.toMatchObject({
        code: "unavailable",
        retryable: true,
      });
    }
    const error = new ObjectStorageError("get", "unavailable");
    expect(JSON.stringify(error)).toBe('{"code":"unavailable","operation":"get","retryable":true}');
    expect(new ObjectStorageError("put", "invalid").retryable).toBe(false);
  });
});
