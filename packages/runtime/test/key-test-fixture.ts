import { KeyRingId } from "../src/index.js";
import { ControlledClock, SequenceRandomSource, TestKeyManagementAdapter } from "../src/testing.js";

export async function keyFixture() {
  const wrappingKey = await crypto.subtle.importKey("raw", new Uint8Array(32), "AES-GCM", false, [
    "encrypt",
    "decrypt",
  ]);
  const clock = new ControlledClock(1_000);
  return {
    adapter: new TestKeyManagementAdapter(clock, new SequenceRandomSource([new Uint8Array(12)]), {
      handle: "test:wrapping/key",
      key: wrappingKey,
      keyId: "test-wrapping-key",
      purpose: "data-encryption",
    }),
    clock,
    ringId: KeyRingId.parse("issuer:ring/one"),
  };
}
