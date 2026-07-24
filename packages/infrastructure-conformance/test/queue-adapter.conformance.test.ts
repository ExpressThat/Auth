import {
  DurableQueueError,
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
  QueueDeliveryLimit,
  QueueIdempotencyKey,
  QueueLeaseDuration,
  QueueMessageType,
  QueueName,
  QueuePayload,
  QueueSchemaVersion,
  QueueScope,
  UuidV7Generator,
} from "@expressthat-auth/runtime";
import {
  ControlledClock,
  SequenceRandomSource,
  TestDurableQueueAdapter,
  TestQueueBackend,
} from "@expressthat-auth/runtime/testing";
import { describe, expect, it } from "vitest";
import { defineQueueConformanceSuite } from "../src/index.js";
import { conformanceCanary, statefulAdapterProbes } from "./adapter-probes.js";

function fixture() {
  const clock = new ControlledClock(1_000);
  const backend = new TestQueueBackend();
  const random = new SequenceRandomSource(
    Array.from({ length: 8 }, (_, index) => new Uint8Array(10).fill(index + 1)),
  );
  const id = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
    PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));
  const scope = QueueScope.create({
    applicationId: id("app", "040506070803"),
    customerOrganisationId: id("org", "040506070801"),
    environmentId: id("env", "040506070802"),
  });
  const adapter = new TestDurableQueueAdapter(clock, new UuidV7Generator(clock, random), backend);
  return { adapter, backend, scope };
}

function publication(scope: QueueScope, key: string, payload = "payload") {
  return {
    classifications: ["personal"] as const,
    idempotencyExpiresAt: EpochMilliseconds.parse(86_401_000),
    idempotencyKey: QueueIdempotencyKey.parse(key),
    maxDeliveryAttempts: QueueDeliveryLimit.parse(2),
    payload: QueuePayload.fromBytes(new TextEncoder().encode(payload)),
    queue: QueueName.parse("notifications"),
    scheduledAt: EpochMilliseconds.parse(1_000),
    schemaVersion: QueueSchemaVersion.parse(1),
    scope,
    type: QueueMessageType.parse("email.send"),
  };
}

describe("deterministic queue adapter conformance", () => {
  it("passes every queue conformance axis", async () => {
    const suite = defineQueueConformanceSuite(
      statefulAdapterProbes({
        concurrency: async () => {
          const { adapter, scope } = fixture();
          return Promise.allSettled(
            [1, 2, 3].map((index) => adapter.publish(publication(scope, `event/${index}`))),
          );
        },
        failure: async () => {
          const { adapter, scope } = fixture();
          return adapter.publish({
            ...publication(scope, "invalid"),
            classifications: [],
          });
        },
        health: async () => {
          const { adapter, backend } = fixture();
          expect((await adapter.health()).deliveryGuarantee).toBe("at-least-once");
          backend.degraded = true;
          expect((await adapter.health()).status).toBe("degraded");
        },
        redaction: async () => {
          const { adapter, backend, scope } = fixture();
          backend.available = false;
          return adapter
            .publish(publication(scope, "redaction", conformanceCanary()))
            .catch((error: unknown) => error);
        },
        residency: async () => {
          const first = fixture();
          const second = fixture();
          const published = await first.adapter.publish(publication(first.scope, "isolated"));
          const received = await second.adapter.receive({
            leaseDuration: QueueLeaseDuration.milliseconds(10),
            maxMessages: 1,
            queue: QueueName.parse("notifications"),
          });
          expect(published.deduplicated).toBe(false);
          expect(received).toHaveLength(0);
        },
        retry: async () => Promise.reject(new DurableQueueError("receive", "unavailable")),
        success: async () => {
          const { adapter, scope } = fixture();
          expect((await adapter.publish(publication(scope, "success"))).deduplicated).toBe(false);
        },
      }),
      2_000,
    );
    expect((await suite.run()).results).toHaveLength(9);
  });
});
