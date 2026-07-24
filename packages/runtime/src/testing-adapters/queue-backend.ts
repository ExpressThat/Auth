import type { EpochMilliseconds, QueueMessage, QueueReceipt } from "../index.js";

export type QueueState = "acknowledged" | "dead-lettered" | "leased" | "queued";

export type QueueRecord = {
  availableAt: EpochMilliseconds;
  currentReceipt?: QueueReceipt;
  message: QueueMessage;
  nextAttempt: number;
  state: QueueState;
};

export class TestQueueBackend {
  public readonly idempotency = new Map<string, { fingerprint: string; record: QueueRecord }>();
  public readonly records = new Map<string, QueueRecord>();
  public available = true;
  public degraded = false;
}
