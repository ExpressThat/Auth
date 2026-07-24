import {
  EntityId,
  EpochMilliseconds,
  ObjectChecksum,
  ObjectContentLength,
  ObjectKey,
  ObjectMediaType,
  ObjectRegion,
  ObjectScope,
  ObjectStorageError,
  ObjectVersion,
  PublicEntityId,
} from "@expressthat-auth/runtime";
import {
  ControlledClock,
  TestObjectBody,
  TestObjectStorageAdapter,
} from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineObjectStorageConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";

async function fixture(policy: "eu-only" | "operator-managed" = "eu-only") {
  const bytes = new TextEncoder().encode("body");
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", bytes));
  const id = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
    PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));
  const request = {
    body: TestObjectBody.fromChunks([bytes]),
    checksum: ObjectChecksum.sha256(digest),
    classifications: ["personal"] as const,
    contentLength: ObjectContentLength.bytes(bytes.length),
    encryption: "application-envelope" as const,
    expiresAt: EpochMilliseconds.parse(2_000),
    key: ObjectKey.parse("exports/one.zip"),
    mediaType: ObjectMediaType.parse("application/zip"),
    requiredResidency: "eu-only" as const,
    scope: ObjectScope.create({
      applicationId: id("app", "040506070803"),
      customerOrganisationId: id("org", "040506070801"),
      environmentId: id("env", "040506070802"),
    }),
  };
  const adapter = new TestObjectStorageAdapter(new ControlledClock(1_000), {
    policy,
    processingRegion: ObjectRegion.parse(policy === "eu-only" ? "eu-west" : "custom"),
    storageRegion: ObjectRegion.parse(policy === "eu-only" ? "eu-west" : "custom"),
  });
  return { adapter, request };
}

describe("deterministic object-storage adapter conformance", () => {
  it("passes every object-storage conformance axis", async () => {
    const suite = defineObjectStorageConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const fixtures = await Promise.all([fixture(), fixture(), fixture()]);
          return Promise.allSettled(fixtures.map(({ adapter, request }) => adapter.put(request)));
        },
        failure: async () => {
          const { adapter, request } = await fixture();
          return adapter.get({ key: request.key, scope: request.scope }).then(() =>
            adapter.delete({
              expectedVersion: ObjectVersion.parse("missing"),
              key: request.key,
              scope: request.scope,
            }),
          );
        },
        health: async () => {
          const { adapter } = await fixture();
          expect((await adapter.health()).supportsChecksums).toBe(true);
        },
        redaction: async () => {
          const { adapter, request } = await fixture();
          return adapter
            .put({
              ...request,
              body: TestObjectBody.fromChunks([new TextEncoder().encode(conformanceCanary())]),
            })
            .catch((error: unknown) => error);
        },
        residency: async () => {
          const { adapter, request } = await fixture("operator-managed");
          await expect(adapter.put(request)).rejects.toMatchObject({
            code: "residency-violation",
          });
        },
        retry: async () => {
          return Promise.reject(new ObjectStorageError("get", "unavailable"));
        },
        success: async () => {
          const { adapter, request } = await fixture();
          expect((await adapter.put(request)).residency.policy).toBe("eu-only");
        },
      }),
      2_000,
    );
    expect((await suite.run()).results).toHaveLength(9);
  });
});
