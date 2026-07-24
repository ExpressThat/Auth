import { describe, expect, it } from "vitest";
import { KeyLifecycleVersion, KeyRingId } from "../src/index.js";
import { keyFixture } from "./key-test-fixture.js";

describe("signing-key lifecycle conformance", () => {
  it("rotates, publishes only safe RSA metadata, and signs exact bytes", async () => {
    const { adapter, ringId } = await keyFixture();
    const rotation = await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(0),
      purpose: "issuer-signing",
      ringId,
    });
    const published = await adapter.publish(ringId);
    const payload = new TextEncoder().encode("signed bytes");
    const signature = await adapter.sign({
      algorithm: "RS256",
      payload,
      purpose: "issuer-signing",
      ringId,
    });

    expect(rotation.active.state).toBe("active");
    expect(rotation.active.keyId).toHaveLength(43);
    expect(published.keys).toEqual([rotation.active.publicKey]);
    expect(JSON.stringify(published)).not.toContain("test:key/");
    expect(JSON.stringify(published)).not.toMatch(/"d"|"p"|"q"|"dp"|"dq"|"qi"/u);
    const publishedKey = published.keys[0];
    if (!publishedKey) {
      throw new Error("Expected an active published key.");
    }
    await expect(adapter.verify({ key: publishedKey, payload, signature })).resolves.toBe(true);
    payload[0] = 0;
    await expect(adapter.verify({ key: publishedKey, payload, signature })).resolves.toBe(false);
  });

  it("supports ES256 through the same exact-byte contract", async () => {
    const { adapter } = await keyFixture();
    const ringId = KeyRingId.parse("issuer:ring/ec");
    const rotation = await adapter.rotate({
      algorithm: "ES256",
      expectedRingVersion: KeyLifecycleVersion.parse(0),
      purpose: "issuer-signing",
      ringId,
    });
    const payload = new Uint8Array([1, 2, 3]);
    const signature = await adapter.sign({
      algorithm: "ES256",
      payload,
      purpose: "issuer-signing",
      ringId,
    });

    await expect(
      adapter.verify({ key: rotation.active.publicKey, payload, signature }),
    ).resolves.toBe(true);
  });

  it("overlaps retiring keys, then removes retired keys from publication", async () => {
    const { adapter, clock, ringId } = await keyFixture();
    const first = await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(0),
      purpose: "issuer-signing",
      ringId,
    });
    clock.advance(100);
    const second = await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(1),
      purpose: "issuer-signing",
      ringId,
    });

    expect(second.previous).toMatchObject({ keyId: first.active.keyId, state: "retiring" });
    expect((await adapter.publish(ringId)).keys).toHaveLength(2);
    clock.advance(100);
    const retired = await adapter.retire({
      expectedRingVersion: KeyLifecycleVersion.parse(2),
      keyId: first.active.keyId,
      ringId,
    });
    expect(retired.state).toBe("retired");
    expect(Number(retired.retiredAt)).toBe(1_200);
    expect((await adapter.publish(ringId)).keys).toEqual([second.active.publicKey]);
  });

  it("fails closed for stale lifecycle state and signing confusion", async () => {
    const { adapter, ringId } = await keyFixture();
    const first = await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(0),
      purpose: "issuer-signing",
      ringId,
    });

    await expect(
      adapter.rotate({
        algorithm: "RS256",
        expectedRingVersion: KeyLifecycleVersion.parse(0),
        purpose: "issuer-signing",
        ringId,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      adapter.retire({
        expectedRingVersion: KeyLifecycleVersion.parse(1),
        keyId: first.active.keyId,
        ringId,
      }),
    ).rejects.toMatchObject({ code: "invalid-state" });
    await expect(
      adapter.retire({
        expectedRingVersion: KeyLifecycleVersion.parse(0),
        keyId: first.active.keyId,
        ringId,
      }),
    ).rejects.toMatchObject({ code: "conflict" });
    await expect(
      adapter.retire({
        expectedRingVersion: KeyLifecycleVersion.parse(1),
        keyId: "missing-key",
        ringId,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
    await expect(
      adapter.sign({
        algorithm: "ES256",
        payload: new Uint8Array(),
        purpose: "issuer-signing",
        ringId,
      }),
    ).rejects.toMatchObject({ code: "algorithm-mismatch" });
    await expect(
      adapter.sign({
        algorithm: "RS256",
        payload: new Uint8Array(),
        purpose: "webhook-signing",
        ringId,
      }),
    ).rejects.toMatchObject({ code: "purpose-mismatch" });
  });

  it("rejects missing rings for publication, signing, and retirement", async () => {
    const { adapter } = await keyFixture();
    const missing = KeyRingId.parse("issuer:ring/missing");

    await expect(adapter.publish(missing)).rejects.toMatchObject({ code: "not-found" });
    await expect(
      adapter.sign({
        algorithm: "RS256",
        payload: new Uint8Array(),
        purpose: "issuer-signing",
        ringId: missing,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
    await expect(
      adapter.retire({
        expectedRingVersion: KeyLifecycleVersion.parse(0),
        keyId: "missing-key",
        ringId: missing,
      }),
    ).rejects.toMatchObject({ code: "not-found" });
  });

  it("fails closed if a test fault removes every active key", async () => {
    const { adapter, ringId } = await keyFixture();
    await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(0),
      purpose: "issuer-signing",
      ringId,
    });
    await adapter.rotate({
      algorithm: "RS256",
      expectedRingVersion: KeyLifecycleVersion.parse(1),
      purpose: "issuer-signing",
      ringId,
    });
    adapter.clearActiveKeysForTest(ringId);

    await expect(
      adapter.sign({
        algorithm: "RS256",
        payload: new Uint8Array(),
        purpose: "issuer-signing",
        ringId,
      }),
    ).rejects.toMatchObject({ code: "invalid-state" });
  });
});
