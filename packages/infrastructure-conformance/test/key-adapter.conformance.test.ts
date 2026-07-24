import { KeyLifecycleVersion, KeyManagementError, KeyRingId } from "@expressthat-auth/runtime";
import {
  ControlledClock,
  SequenceRandomSource,
  TestKeyManagementAdapter,
} from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineKeyManagementConformanceSuite } from "../src/index.js";
import { custodyAdapterProbes } from "./adapter-probes.js";

async function fixture() {
  const wrappingKey = await crypto.subtle.importKey("raw", new Uint8Array(32), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  return {
    adapter: new TestKeyManagementAdapter(
      new ControlledClock(1_000),
      new SequenceRandomSource([new Uint8Array(12)]),
      {
        handle: "test:wrapping/key",
        key: wrappingKey,
        keyId: "test-wrapping-key",
        purpose: "data-encryption",
      },
    ),
    ringId: KeyRingId.parse("issuer:ring/one"),
  };
}

async function rotate() {
  const current = await fixture();
  const result = await current.adapter.rotate({
    algorithm: "ES256",
    expectedRingVersion: KeyLifecycleVersion.parse(0),
    purpose: "issuer-signing",
    ringId: current.ringId,
  });
  return { ...current, result };
}

describe("deterministic key-management adapter conformance", () => {
  it("passes every applicable key-management conformance axis", async () => {
    const suite = defineKeyManagementConformanceSuite(
      custodyAdapterProbes({
        concurrency: async () => Promise.allSettled([rotate(), rotate(), rotate()]),
        failure: async () => {
          const { adapter, ringId } = await fixture();
          return adapter.publish(ringId);
        },
        redaction: async () => {
          const { result } = await rotate();
          return result.active;
        },
        residency: async () => {
          const first = await rotate();
          const second = await fixture();
          expect((await first.adapter.publish(first.ringId)).keys).toHaveLength(1);
          await expect(second.adapter.publish(second.ringId)).rejects.toMatchObject({
            code: "not-found",
          });
        },
        retry: async () => Promise.reject(new KeyManagementError("sign", "unavailable")),
        success: async () => {
          const { adapter, result, ringId } = await rotate();
          expect(result.ringVersion.numberValue()).toBe(1);
          expect((await adapter.publish(ringId)).keys).toHaveLength(1);
        },
      }),
      5_000,
    );
    expect((await suite.run()).results).toHaveLength(8);
  });
});
