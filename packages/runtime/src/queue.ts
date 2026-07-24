import type { DataClassification } from "./data-classification.js";
import type { PublicEntityId } from "./identifier.js";
import type {
  QueueDeliveryAttempt,
  QueueDeliveryLimit,
  QueueIdempotencyKey,
  QueueLeaseDuration,
  QueueLeaseToken,
  QueueMessageType,
  QueueName,
  QueuePayload,
  QueueSchemaVersion,
  QueueScope,
} from "./queue-values.js";
import type { EpochMilliseconds } from "./time.js";

export type QueueDataClassification = DataClassification;
export type QueueDeliveryGuarantee = "at-least-once";
export type QueueHealthStatus = "degraded" | "healthy" | "unavailable";
export type QueueOperation =
  | "acknowledge"
  | "dead-letter"
  | "health"
  | "publish"
  | "receive"
  | "renew-lease"
  | "retry";
export type QueueErrorCode =
  | "conflict"
  | "expired"
  | "invalid"
  | "lease-lost"
  | "not-found"
  | "payload-too-large"
  | "residency-violation"
  | "unavailable"
  | "unsupported";
export type QueueRetryOutcome = "dead-lettered" | "scheduled";

export interface PublishQueueRequest {
  readonly classifications: readonly QueueDataClassification[];
  readonly expiresAt?: EpochMilliseconds;
  readonly idempotencyExpiresAt: EpochMilliseconds;
  readonly idempotencyKey: QueueIdempotencyKey;
  readonly maxDeliveryAttempts: QueueDeliveryLimit;
  readonly payload: QueuePayload;
  readonly queue: QueueName;
  readonly scheduledAt: EpochMilliseconds;
  readonly schemaVersion: QueueSchemaVersion;
  readonly scope: QueueScope;
  readonly type: QueueMessageType;
}

export interface PublishedQueueMessage {
  readonly deduplicated: boolean;
  readonly messageId: PublicEntityId<"job">;
  readonly publishedAt: EpochMilliseconds;
}

export interface QueueMessage extends PublishQueueRequest {
  readonly messageId: PublicEntityId<"job">;
  readonly publishedAt: EpochMilliseconds;
}

export interface QueueReceipt {
  readonly attempt: QueueDeliveryAttempt;
  readonly leaseExpiresAt: EpochMilliseconds;
  readonly leaseToken: QueueLeaseToken;
  readonly messageId: PublicEntityId<"job">;
}

export interface QueueDelivery {
  readonly message: QueueMessage;
  readonly receipt: QueueReceipt;
}

export interface ReceiveQueueRequest {
  readonly leaseDuration: QueueLeaseDuration;
  readonly maxMessages: number;
  readonly queue: QueueName;
}

export interface QueueReceiptRequest {
  readonly receipt: QueueReceipt;
}

export interface RenewQueueLeaseRequest extends QueueReceiptRequest {
  readonly leaseDuration: QueueLeaseDuration;
}

export interface RetryQueueMessageRequest extends QueueReceiptRequest {
  readonly availableAt: EpochMilliseconds;
}

export interface DeadLetterQueueMessageRequest extends QueueReceiptRequest {
  readonly reasonCode: QueueMessageType;
}

export interface QueueRetryResult {
  readonly availableAt?: EpochMilliseconds;
  readonly outcome: QueueRetryOutcome;
}

export interface QueueHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly deliveryGuarantee: QueueDeliveryGuarantee;
  readonly status: QueueHealthStatus;
  readonly supportsDelayedDelivery: boolean;
  readonly supportsLeaseRenewal: boolean;
}

export interface DurableQueueProvider {
  acknowledge(request: QueueReceiptRequest): Promise<void>;
  deadLetter(request: DeadLetterQueueMessageRequest): Promise<void>;
  health(): Promise<QueueHealth>;
  publish(request: PublishQueueRequest): Promise<PublishedQueueMessage>;
  receive(request: ReceiveQueueRequest): Promise<readonly QueueDelivery[]>;
  renewLease(request: RenewQueueLeaseRequest): Promise<QueueReceipt>;
  retry(request: RetryQueueMessageRequest): Promise<QueueRetryResult>;
}

export class DurableQueueError extends Error {
  public readonly code: QueueErrorCode;
  public readonly operation: QueueOperation;
  public readonly retryable: boolean;

  public constructor(operation: QueueOperation, code: QueueErrorCode) {
    super(`Durable queue ${operation} failed (${code}).`);
    this.name = "DurableQueueError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "lease-lost" || code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: QueueErrorCode;
    operation: QueueOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
