import type { PublishQueueRequest } from "../src/index.js";
import {
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
  QueueDeliveryLimit,
  QueueIdempotencyKey,
  QueueMessageType,
  QueueName,
  QueuePayload,
  QueueSchemaVersion,
  QueueScope,
  UuidV7Generator,
} from "../src/index.js";
import { ControlledClock, SequenceRandomSource } from "../src/testing.js";
import { TestDurableQueueAdapter, TestQueueBackend } from "./queue-test-adapter.js";

const entity = <TPrefix extends "app" | "env" | "org">(prefix: TPrefix, suffix: string) =>
  PublicEntityId.create(prefix, EntityId.parse(`01234567-89ab-7001-8203-${suffix}`));

export function queueFixture() {
  const clock = new ControlledClock(1_000);
  const random = new SequenceRandomSource(
    Array.from({ length: 10 }, (_, index) => {
      const bytes = new Uint8Array(10);
      bytes[9] = index + 1;
      return bytes;
    }),
  );
  const identifiers = new UuidV7Generator(clock, random);
  const backend = new TestQueueBackend();
  const adapter = new TestDurableQueueAdapter(clock, identifiers, backend);
  const scope = QueueScope.create({
    applicationId: entity("app", "040506070803"),
    customerOrganisationId: entity("org", "040506070801"),
    environmentId: entity("env", "040506070802"),
  });
  return { adapter, backend, clock, identifiers, scope };
}

export function publication(
  scope: QueueScope,
  overrides: Partial<PublishQueueRequest> = {},
): PublishQueueRequest {
  return {
    classifications: ["personal"],
    idempotencyExpiresAt: EpochMilliseconds.parse(86_401_000),
    idempotencyKey: QueueIdempotencyKey.parse("event/user-one"),
    maxDeliveryAttempts: QueueDeliveryLimit.parse(2),
    payload: QueuePayload.fromBytes(new TextEncoder().encode("payload")),
    queue: QueueName.parse("notifications"),
    scheduledAt: EpochMilliseconds.parse(1_000),
    schemaVersion: QueueSchemaVersion.parse(1),
    scope,
    type: QueueMessageType.parse("email.send"),
    ...overrides,
  };
}
