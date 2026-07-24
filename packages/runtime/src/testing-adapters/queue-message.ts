import type { PublishQueueRequest, QueueMessage } from "../index.js";
import { QueuePayload } from "../index.js";

export function copyQueueMessage(message: QueueMessage): QueueMessage {
  return {
    ...message,
    classifications: [...message.classifications],
    payload: QueuePayload.fromBytes(message.payload.copyForProvider()),
  };
}

export function queuePublicationFingerprint(request: PublishQueueRequest): string {
  const bytes = [...request.payload.copyForProvider()].join(",");
  return [
    request.type.identifier(),
    request.schemaVersion.numberValue(),
    request.scheduledAt.toJSON(),
    request.expiresAt?.toJSON() ?? "-",
    request.idempotencyExpiresAt.toJSON(),
    request.maxDeliveryAttempts.numberValue(),
    [...request.classifications].sort().join(","),
    bytes,
  ].join("|");
}
