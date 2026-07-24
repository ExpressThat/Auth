import { describe, expect, it } from "vitest";
import { EpochMilliseconds, QueueLeaseDuration, QueueMessageType } from "../src/index.js";
import { TestDurableQueueAdapter } from "../src/testing.js";
import { publication, queueFixture } from "./queue-test-fixture.js";

const lease = QueueLeaseDuration.milliseconds(100);

describe("durable queue delivery", () => {
  it("leases to one competing consumer and redelivers after abandonment", async () => {
    const { adapter, backend, clock, identifiers, scope } = queueFixture();
    const replica = new TestDurableQueueAdapter(clock, identifiers, backend);
    const request = publication(scope);
    await adapter.publish(request);
    const first = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });

    await expect(
      replica.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
    ).resolves.toEqual([]);
    clock.advance(100);
    const [redelivery] = await replica.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    expect(first[0]?.receipt.attempt.numberValue()).toBe(1);
    expect(redelivery?.receipt.attempt.numberValue()).toBe(2);
    expect(redelivery?.message.messageId).toEqual(first[0]?.message.messageId);
  });

  it("renews with a new token and rejects stale acknowledgements", async () => {
    const { adapter, scope } = queueFixture();
    const request = publication(scope);
    await adapter.publish(request);
    const [delivery] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    if (!delivery) {
      throw new Error("Expected a queue delivery.");
    }
    const renewed = await adapter.renewLease({
      leaseDuration: QueueLeaseDuration.milliseconds(200),
      receipt: delivery.receipt,
    });

    expect(renewed.leaseToken.identifier()).not.toBe(delivery.receipt.leaseToken.identifier());
    await expect(adapter.acknowledge({ receipt: delivery.receipt })).rejects.toMatchObject({
      code: "lease-lost",
    });
    await expect(adapter.acknowledge({ receipt: renewed })).resolves.toBeUndefined();
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
    ).resolves.toEqual([]);
  });

  it("schedules a retry and dead-letters after the bounded final attempt", async () => {
    const { adapter, clock, scope } = queueFixture();
    const request = publication(scope);
    await adapter.publish(request);
    const [first] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    if (!first) {
      throw new Error("Expected the first delivery.");
    }
    await expect(
      adapter.retry({
        availableAt: EpochMilliseconds.parse(1_050),
        receipt: first.receipt,
      }),
    ).resolves.toEqual({
      availableAt: EpochMilliseconds.parse(1_050),
      outcome: "scheduled",
    });
    clock.advance(50);
    const [second] = await adapter.receive({
      leaseDuration: lease,
      maxMessages: 1,
      queue: request.queue,
    });
    if (!second) {
      throw new Error("Expected the second delivery.");
    }
    await expect(
      adapter.retry({ availableAt: EpochMilliseconds.parse(1_100), receipt: second.receipt }),
    ).resolves.toEqual({ outcome: "dead-lettered" });
    clock.advance(50);
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
    ).resolves.toEqual([]);
  });

  it("supports explicit dead-lettering", async () => {
    const { adapter, scope } = queueFixture();
    const request = publication(scope);
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
      adapter.deadLetter({
        reasonCode: QueueMessageType.parse("handler.poison"),
        receipt: delivery.receipt,
      }),
    ).resolves.toBeUndefined();
    await expect(
      adapter.receive({ leaseDuration: lease, maxMessages: 1, queue: request.queue }),
    ).resolves.toEqual([]);
  });
});
