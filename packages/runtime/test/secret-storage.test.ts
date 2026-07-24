import { describe, expect, it } from "vitest";
import {
  EpochMilliseconds,
  SecretMaterial,
  SecretPurpose,
  SecretReference,
  SecretVersion,
} from "../src/index.js";
import { ControlledClock, TestSecretStorageAdapter } from "../src/testing.js";

const CANARY_SECRET = "run004-canary-secret";

function fixture() {
  const clock = new ControlledClock(1_000);
  return {
    adapter: new TestSecretStorageAdapter(clock),
    clock,
    purpose: SecretPurpose.parse("provider.email"),
  };
}

describe("secret storage contract", () => {
  it("creates reference-only metadata and resolves a defensive material copy", async () => {
    const { adapter, purpose } = fixture();
    const created = await adapter.create({
      material: SecretMaterial.fromUtf8(CANARY_SECRET),
      purpose,
    });

    expect(Number(created.createdAt)).toBe(1_000);
    expect(created.currentVersion.numberValue()).toBe(1);
    expect(created.purpose).toBe(purpose);
    expect(JSON.stringify(created)).not.toContain(CANARY_SECRET);
    const resolved = await adapter.resolve({ purpose, reference: created.reference });
    const firstCopy = resolved.material.copyForProvider();
    firstCopy[0] = 0;
    expect(new TextDecoder().decode(resolved.material.copyForProvider())).toBe(CANARY_SECRET);
  });

  it("rotates with optimistic concurrency and retains explicit overlap metadata", async () => {
    const { adapter, clock, purpose } = fixture();
    const created = await adapter.create({
      material: SecretMaterial.fromUtf8("version-one"),
      purpose,
    });
    clock.advance(500);
    const rotated = await adapter.rotate({
      expectedCurrentVersion: SecretVersion.parse(1),
      material: SecretMaterial.fromUtf8("version-two"),
      reference: created.reference,
    });

    expect(rotated.currentVersion.numberValue()).toBe(2);
    expect(Number(rotated.lastRotatedAt)).toBe(1_500);
    await expect(
      adapter.metadata({ reference: created.reference, version: SecretVersion.parse(1) }),
    ).resolves.toMatchObject({
      replacedAt: EpochMilliseconds.parse(1_500),
      state: "superseded",
    });
    const current = await adapter.resolve({ purpose, reference: created.reference });
    const previous = await adapter.resolve({
      purpose,
      reference: created.reference,
      version: SecretVersion.parse(1),
    });
    expect(new TextDecoder().decode(current.material.copyForProvider())).toBe("version-two");
    expect(new TextDecoder().decode(previous.material.copyForProvider())).toBe("version-one");
  });

  it("disables the current version and rejects further secret use", async () => {
    const { adapter, clock, purpose } = fixture();
    const created = await adapter.create({
      material: SecretMaterial.fromUtf8(CANARY_SECRET),
      purpose,
    });
    clock.advance(1);
    const disabled = await adapter.disable({
      expectedCurrentVersion: SecretVersion.parse(1),
      reference: created.reference,
    });

    expect(Number(disabled.disabledAt)).toBe(1_001);
    await expect(adapter.metadata({ reference: created.reference })).resolves.toMatchObject({
      disabledAt: EpochMilliseconds.parse(1_001),
      state: "disabled",
    });
    await expect(adapter.resolve({ purpose, reference: created.reference })).rejects.toMatchObject({
      code: "disabled",
    });
    await expect(
      adapter.rotate({
        expectedCurrentVersion: SecretVersion.parse(1),
        material: SecretMaterial.fromUtf8("replacement"),
        reference: created.reference,
      }),
    ).rejects.toMatchObject({ code: "disabled" });
    await expect(
      adapter.disable({
        expectedCurrentVersion: SecretVersion.parse(1),
        reference: created.reference,
      }),
    ).rejects.toMatchObject({ code: "disabled" });
  });

  it("fails safely for stale versions, wrong purposes, and missing references", async () => {
    const { adapter, purpose } = fixture();
    const created = await adapter.create({
      material: SecretMaterial.fromUtf8(CANARY_SECRET),
      purpose,
    });

    await expect(
      adapter.rotate({
        expectedCurrentVersion: SecretVersion.parse(2),
        material: SecretMaterial.fromUtf8("replacement"),
        reference: created.reference,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "rotate" });
    await expect(
      adapter.disable({
        expectedCurrentVersion: SecretVersion.parse(2),
        reference: created.reference,
      }),
    ).rejects.toMatchObject({ code: "conflict", operation: "disable" });
    await expect(
      adapter.resolve({
        purpose: SecretPurpose.parse("provider.sms"),
        reference: created.reference,
      }),
    ).rejects.toMatchObject({ code: "purpose-mismatch" });
    await expect(
      adapter.metadata({
        reference: created.reference,
        version: SecretVersion.parse(99),
      }),
    ).resolves.toBeUndefined();
    await expect(
      adapter.resolve({
        purpose,
        reference: created.reference,
        version: SecretVersion.parse(99),
      }),
    ).rejects.toMatchObject({ code: "not-found" });

    const missing = SecretReference.parse("test:secret/missing");
    await expect(adapter.metadata({ reference: missing })).resolves.toBeUndefined();
    await expect(adapter.resolve({ purpose, reference: missing })).rejects.toMatchObject({
      code: "not-found",
    });
    await expect(
      adapter.rotate({
        expectedCurrentVersion: SecretVersion.parse(1),
        material: SecretMaterial.fromUtf8("replacement"),
        reference: missing,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
    await expect(
      adapter.disable({
        expectedCurrentVersion: SecretVersion.parse(1),
        reference: missing,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("fails closed if a test fault corrupts the version invariant", async () => {
    const { adapter, purpose } = fixture();
    const created = await adapter.create({
      material: SecretMaterial.fromUtf8(CANARY_SECRET),
      purpose,
    });
    adapter.clearVersionsForTest(created.reference);

    await expect(adapter.metadata({ reference: created.reference })).rejects.toThrow("no versions");
  });
});
