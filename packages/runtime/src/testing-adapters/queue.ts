import type {
  Clock,
  DeadLetterQueueMessageRequest,
  DurableQueueProvider,
  IdentifierGenerator,
  PublishedQueueMessage,
  PublishQueueRequest,
  QueueDelivery,
  QueueHealth,
  QueueMessage,
  QueueOperation,
  QueueReceipt,
  QueueReceiptRequest,
  QueueRetryResult,
  ReceiveQueueRequest,
  RenewQueueLeaseRequest,
  RetryQueueMessageRequest,
} from "../index.js";
import {
  DurableQueueError,
  EpochMilliseconds,
  PublicEntityId,
  QueueDeliveryAttempt,
  QueueLeaseToken,
  QueuePayload,
} from "../index.js";
import { type QueueRecord, TestQueueBackend } from "./queue-backend.js";
import { copyQueueMessage, queuePublicationFingerprint } from "./queue-message.js";

export { TestQueueBackend } from "./queue-backend.js";

export class TestDurableQueueAdapter implements DurableQueueProvider {
  readonly #backend: TestQueueBackend;
  readonly #clock: Clock;
  readonly #identifiers: IdentifierGenerator;
  #leaseSequence = 0;

  public constructor(
    clock: Clock,
    identifiers: IdentifierGenerator,
    backend = new TestQueueBackend(),
  ) {
    this.#clock = clock;
    this.#identifiers = identifiers;
    this.#backend = backend;
  }

  public async acknowledge(request: QueueReceiptRequest): Promise<void> {
    const record = this.#requireLease(request.receipt, "acknowledge");
    record.state = "acknowledged";
    delete record.currentReceipt;
  }

  public async deadLetter(request: DeadLetterQueueMessageRequest): Promise<void> {
    const record = this.#requireLease(request.receipt, "dead-letter");
    record.state = "dead-lettered";
    delete record.currentReceipt;
  }

  public async health(): Promise<QueueHealth> {
    return {
      checkedAt: this.#clock.now(),
      deliveryGuarantee: "at-least-once",
      status: this.#backend.available
        ? this.#backend.degraded
          ? "degraded"
          : "healthy"
        : "unavailable",
      supportsDelayedDelivery: true,
      supportsLeaseRenewal: true,
    };
  }

  public async publish(request: PublishQueueRequest): Promise<PublishedQueueMessage> {
    this.#requireAvailable("publish");
    this.#validatePublication(request);
    const idempotencyIdentity = [
      request.queue.identifier(),
      request.scope.providerPartition(),
      request.idempotencyKey.identifier(),
    ].join("|");
    const fingerprint = queuePublicationFingerprint(request);
    const existing = this.#backend.idempotency.get(idempotencyIdentity);
    if (existing && existing.record.message.idempotencyExpiresAt.compare(this.#clock.now()) > 0) {
      if (existing.fingerprint !== fingerprint) {
        throw new DurableQueueError("publish", "conflict");
      }
      return {
        deduplicated: true,
        messageId: existing.record.message.messageId,
        publishedAt: existing.record.message.publishedAt,
      };
    }
    if (existing) {
      this.#backend.idempotency.delete(idempotencyIdentity);
    }
    const messageId = PublicEntityId.create("job", this.#identifiers.next());
    const message: QueueMessage = {
      ...request,
      classifications: [...request.classifications],
      messageId,
      payload: QueuePayload.fromBytes(request.payload.copyForProvider()),
      publishedAt: this.#clock.now(),
    };
    const record: QueueRecord = {
      availableAt: request.scheduledAt,
      message,
      nextAttempt: 1,
      state: "queued",
    };
    this.#backend.records.set(messageId.toString(), record);
    this.#backend.idempotency.set(idempotencyIdentity, { fingerprint, record });
    return { deduplicated: false, messageId, publishedAt: message.publishedAt };
  }

  public async receive(request: ReceiveQueueRequest): Promise<readonly QueueDelivery[]> {
    this.#requireAvailable("receive");
    if (
      !Number.isSafeInteger(request.maxMessages) ||
      request.maxMessages < 1 ||
      request.maxMessages > 100
    ) {
      throw new DurableQueueError("receive", "invalid");
    }
    const now = this.#clock.now();
    const deliveries: QueueDelivery[] = [];
    for (const record of this.#backend.records.values()) {
      if (deliveries.length >= request.maxMessages) {
        break;
      }
      this.#releaseExpiredLease(record, now);
      if (this.#isExpired(record, now)) {
        record.state = "dead-lettered";
      }
      if (
        record.state !== "queued" ||
        record.message.queue.identifier() !== request.queue.identifier() ||
        record.availableAt.compare(now) > 0
      ) {
        continue;
      }
      const receipt = this.#lease(record, request, now);
      deliveries.push({ message: copyQueueMessage(record.message), receipt });
    }
    return deliveries;
  }

  public async renewLease(request: RenewQueueLeaseRequest): Promise<QueueReceipt> {
    const record = this.#requireLease(request.receipt, "renew-lease");
    this.#leaseSequence += 1;
    const receipt: QueueReceipt = {
      ...request.receipt,
      leaseExpiresAt: this.#leaseExpiry(request.leaseDuration.numberValue()),
      leaseToken: QueueLeaseToken.parse(`test:lease/${String(this.#leaseSequence)}`),
    };
    record.currentReceipt = receipt;
    return receipt;
  }

  public async retry(request: RetryQueueMessageRequest): Promise<QueueRetryResult> {
    const record = this.#requireLease(request.receipt, "retry");
    if (request.availableAt.compare(this.#clock.now()) < 0) {
      throw new DurableQueueError("retry", "invalid");
    }
    delete record.currentReceipt;
    if (request.receipt.attempt.numberValue() >= record.message.maxDeliveryAttempts.numberValue()) {
      record.state = "dead-lettered";
      return { outcome: "dead-lettered" };
    }
    record.availableAt = request.availableAt;
    record.state = "queued";
    return { availableAt: request.availableAt, outcome: "scheduled" };
  }

  #isExpired(record: QueueRecord, now: EpochMilliseconds): boolean {
    const expiresAt = record.message.expiresAt;
    return expiresAt !== undefined && expiresAt.compare(now) <= 0;
  }

  #lease(record: QueueRecord, request: ReceiveQueueRequest, now: EpochMilliseconds): QueueReceipt {
    this.#leaseSequence += 1;
    const receipt: QueueReceipt = {
      attempt: QueueDeliveryAttempt.parse(record.nextAttempt),
      leaseExpiresAt: EpochMilliseconds.parse(Number(now) + request.leaseDuration.numberValue()),
      leaseToken: QueueLeaseToken.parse(`test:lease/${String(this.#leaseSequence)}`),
      messageId: record.message.messageId,
    };
    record.currentReceipt = receipt;
    record.nextAttempt += 1;
    record.state = "leased";
    return receipt;
  }

  #leaseExpiry(duration: number): EpochMilliseconds {
    return EpochMilliseconds.parse(Number(this.#clock.now()) + duration);
  }

  #releaseExpiredLease(record: QueueRecord, now: EpochMilliseconds): void {
    const receipt = record.currentReceipt;
    if (record.state === "leased" && receipt && receipt.leaseExpiresAt.compare(now) <= 0) {
      delete record.currentReceipt;
      record.state = "queued";
    }
  }

  #requireAvailable(operation: QueueOperation): void {
    if (!this.#backend.available) {
      throw new DurableQueueError(operation, "unavailable");
    }
  }

  #requireLease(
    receipt: QueueReceipt,
    operation: "acknowledge" | "dead-letter" | "renew-lease" | "retry",
  ): QueueRecord {
    this.#requireAvailable(operation);
    const record = this.#backend.records.get(receipt.messageId.toString());
    if (!record) {
      throw new DurableQueueError(operation, "not-found");
    }
    const currentReceipt = record.currentReceipt;
    if (
      record.state !== "leased" ||
      !currentReceipt ||
      currentReceipt.leaseToken.identifier() !== receipt.leaseToken.identifier() ||
      currentReceipt.leaseExpiresAt.compare(this.#clock.now()) <= 0
    ) {
      throw new DurableQueueError(operation, "lease-lost");
    }
    return record;
  }

  #validatePublication(request: PublishQueueRequest): void {
    const expiresAt = request.expiresAt;
    if (
      request.classifications.length < 1 ||
      new Set(request.classifications).size !== request.classifications.length ||
      (expiresAt !== undefined && expiresAt.compare(request.scheduledAt) <= 0) ||
      request.idempotencyExpiresAt.compare(request.scheduledAt) <= 0 ||
      (expiresAt !== undefined && request.idempotencyExpiresAt.compare(expiresAt) < 0)
    ) {
      throw new DurableQueueError("publish", "invalid");
    }
  }
}
