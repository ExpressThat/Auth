import {
  SecretMaterial,
  SecretPurpose,
  SecretReference,
  SecretStorageError,
} from "@expressthat-auth/runtime";
import { ControlledClock, TestSecretStorageAdapter } from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineSecretConformanceSuite } from "../src/index.js";
import { conformanceCanary, custodyAdapterProbes } from "./adapter-probes.js";

const purpose = SecretPurpose.parse("provider.email");

function fixture() {
  return new TestSecretStorageAdapter(new ControlledClock(1_000));
}

function create(adapter: TestSecretStorageAdapter, material = "secret") {
  return adapter.create({
    material: SecretMaterial.fromUtf8(material),
    purpose,
  });
}

describe("deterministic secret adapter conformance", () => {
  it("passes every applicable secret-storage conformance axis", async () => {
    const suite = defineSecretConformanceSuite(
      custodyAdapterProbes({
        concurrency: async () => {
          const adapter = fixture();
          return Promise.allSettled([create(adapter, "one"), create(adapter, "two")]);
        },
        failure: async () =>
          fixture().resolve({
            purpose,
            reference: SecretReference.parse("test:secret/missing"),
          }),
        redaction: async () => {
          const adapter = fixture();
          const metadata = await create(adapter, conformanceCanary());
          return { metadata, provider: "test" };
        },
        residency: async () => {
          const first = fixture();
          const second = fixture();
          const metadata = await create(first);
          await expect(
            second.resolve({ purpose, reference: metadata.reference }),
          ).rejects.toMatchObject({ code: "not-found" });
        },
        retry: async () => Promise.reject(new SecretStorageError("resolve", "unavailable")),
        success: async () => {
          const adapter = fixture();
          const metadata = await create(adapter);
          const resolved = await adapter.resolve({
            purpose,
            reference: metadata.reference,
          });
          expect(resolved.material.copyForProvider()).toHaveLength(6);
        },
      }),
      2_000,
    );
    expect((await suite.run()).results).toHaveLength(8);
  });
});
