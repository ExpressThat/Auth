import { describe, expect, it } from "vitest";
import {
  EntityId,
  EpochMilliseconds,
  PublicEntityId,
  QueueDeliveryAttempt,
  QueueIdempotencyKey,
  QueueLeaseDuration,
  QueueLeaseToken,
  QueueName,
} from "../src/index.js";
import { publication, queueFixture } from "./queue-test-fixture.js";

const lease = QueueLeaseDuration.milliseconds(100);

describe("durable queue failure and health contract", () => {
  it("reports healthy, degraded, and unavailable at-least-once capability", async () => {
    const { adapter, backend } = queueFixture();
    await expect(adapter.health()).resolves.toEqual({
      checkedAt: EpochMilliseconds.parse(1_000),
      deliveryGuarantee: "at-least-once",
      status: "healthy",
      supportsDelayedDelivery: true,
      supportsLeaseRenewal: true,
    });
    backend.degraded = true;
    await expect(adapter.health()).resolves.toMatchObject({ status: "degraded" });
    backend.available = false;
    await expect(adapter.health()).resolves.toMatchObject({ status: "unavailable" });
  });

  it("normalizes provider outages for every state-changing operation", async () => {
    const { adapter, backend, scope } = queueFixture();
    const request = publication(scope);
    const published = await adapter.publish(request);
    const [delivery] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    if (!delivery) {
      throw new Error("Expected a queue delivery.");
    }
    backend.available = false;
    const operations = [
      adapter.publish(
        publication(scope, { idempotencyKey: QueueIdempotencyKey.parse("outage/publish") }),
      ),
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
      adapter.acknowledge({ receipt: delivery.receipt }),
      adapter.renewLease({ leaseDuration: lease, receipt: delivery.receipt }),
      adapter.retry({ availableAt: EpochMilliseconds.parse(1_001), receipt: delivery.receipt }),
      adapter.deadLetter({ reasonCode: request.type, receipt: delivery.receipt }),
    ];
    for (const operation of operations) {
      await expect(operation).rejects.toMatchObject({ code: "unavailable", retryable: true });
    }
    expect(published.messageId.toString()).not.toContain("outage");
  });

  it("rejects invalid receive bounds and missing or forged lease receipts", async () => {
    const { adapter, scope } = queueFixture();
    const request = publication(scope);
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 0, queue: request.queue }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 101, queue: request.queue }),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1.5, queue: request.queue }),
    ).rejects.toMatchObject({ code: "invalid" });

    const missingReceipt = {
      attempt: QueueDeliveryAttempt.parse(1),
      leaseExpiresAt: EpochMilliseconds.parse(2_000),
      leaseToken: QueueLeaseToken.parse("missing/token"),
      messageId: PublicEntityId.create(
        "job",
        EntityId.parse("01234567-89ab-7001-8203-040506070809"),
      ),
    };
    await expect(adapter.acknowledge({ receipt: missingReceipt })).rejects.toMatchObject({
      code: "not-found",
    });

    await adapter.publish(request);
    const [delivery] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    if (!delivery) {
      throw new Error("Expected a queue delivery.");
    }
    await expect(
      adapter.acknowledge({
        receipt: { ...delivery.receipt, leaseToken: QueueLeaseToken.parse("forged/token") },
      }),
    ).rejects.toMatchObject({ code: "lease-lost" });
  });

  it("dead-letters expired work and rejects retrying into the past", async () => {
    const { adapter, clock, scope } = queueFixture();
    const request = publication(scope, {
      expiresAt: EpochMilliseconds.parse(1_001),
      idempotencyKey: QueueIdempotencyKey.parse("expiry/message"),
    });
    await adapter.publish(request);
    clock.advance(1);
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
    ).resolves.toEqual([]);

    const retryable = publication(scope, {
      idempotencyKey: QueueIdempotencyKey.parse("retry/past"),
      queue: QueueName.parse("retry-tests"),
    });
    await adapter.publish(retryable);
    const [delivery] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: retryable.queue,
    });
    if (!delivery) {
      throw new Error("Expected a queue delivery.");
    }
    await expect(
      adapter.retry({ availableAt: EpochMilliseconds.parse(1_000), receipt: delivery.receipt }),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("honors the requested receive batch bound", async () => {
    const { adapter, scope } = queueFixture();
    const queue = QueueName.parse("bounded-receive");
    await adapter.publish(
      publication(scope, {
        idempotencyKey: QueueIdempotencyKey.parse("bounded/one"),
        queue,
      }),
    );
    await adapter.publish(
      publication(scope, {
        idempotencyKey: QueueIdempotencyKey.parse("bounded/two"),
        queue,
      }),
    );

    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue }),
    ).resolves.toHaveLength(1);
  });
});
