import { describe, expect, it } from "vitest";
import {
  DurableQueueError,
  EpochMilliseconds,
  QueueIdempotencyKey,
  QueueLeaseDuration,
  QueuePayload,
} from "../src/index.js";
import { publication, queueFixture } from "./queue-test-fixture.js";

describe("durable queue publication", () => {
  it("publishes a defensive message and deduplicates equivalent retries", async () => {
    const { adapter, scope } = queueFixture();
    const source = new Uint8Array([1, 2, 3]);
    const request = publication(scope, {
      classifications: ["confidential", "personal"],
      payload: QueuePayload.fromBytes(source),
    });
    const first = await adapter.publish(request);
    source[0] = 9;
    const second = await adapter.publish(request);

    expect(first.deduplicated).toBe(false);
    expect(second).toEqual({ ...first, deduplicated: true });
    const [delivery] = await adapter.receive({
      leaseDuration: QueueLeaseDuration.milliseconds(1_000),
      maxMessages: 1,
      queue: request.queue,
    });
    expect([...(delivery?.message.payload.copyForProvider() ?? [])]).toEqual([1, 2, 3]);
    expect(delivery?.message.classifications).not.toBe(request.classifications);
  });

  it("rejects idempotency-key reuse with a different semantic request", async () => {
    const { adapter, scope } = queueFixture();
    await adapter.publish(publication(scope));

    await expect(
      adapter.publish(publication(scope, { payload: QueuePayload.fromBytes(new Uint8Array([9])) })),
    ).rejects.toMatchObject({ code: "conflict", operation: "publish" });
  });

  it("permits a new publication after the explicit idempotency retention expires", async () => {
    const { adapter, clock, scope } = queueFixture();
    const request = publication(scope, {
      idempotencyExpiresAt: EpochMilliseconds.parse(1_001),
    });
    const first = await adapter.publish(request);
    clock.advance(1);
    const second = await adapter.publish(
      publication(scope, { idempotencyExpiresAt: EpochMilliseconds.parse(2_000) }),
    );

    expect(second.deduplicated).toBe(false);
    expect(second.messageId.toString()).not.toBe(first.messageId.toString());
  });

  it("models delayed delivery, expiry, classification, and input validation", async () => {
    const { adapter, clock, scope } = queueFixture();
    const delayed = publication(scope, {
      expiresAt: EpochMilliseconds.parse(2_000),
      idempotencyKey: QueueIdempotencyKey.parse("event/delayed"),
      scheduledAt: EpochMilliseconds.parse(1_500),
    });
    await adapter.publish(delayed);

    await expect(
      adapter.receive({
        leaseDuration: QueueLeaseDuration.milliseconds(100),
        maxMessages: 1,
        queue: delayed.queue,
      }),
    ).resolves.toEqual([]);
    clock.advance(500);
    await expect(
      adapter.receive({
        leaseDuration: QueueLeaseDuration.milliseconds(100),
        maxMessages: 1,
        queue: delayed.queue,
      }),
    ).resolves.toHaveLength(1);

    await expect(
      adapter.publish(
        publication(scope, {
          classifications: [],
          idempotencyKey: QueueIdempotencyKey.parse("invalid/classes"),
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.publish(
        publication(scope, {
          idempotencyExpiresAt: EpochMilliseconds.parse(1_000),
          idempotencyKey: QueueIdempotencyKey.parse("invalid/idempotency-expiry"),
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.publish(
        publication(scope, {
          expiresAt: EpochMilliseconds.parse(2_000),
          idempotencyExpiresAt: EpochMilliseconds.parse(1_999),
          idempotencyKey: QueueIdempotencyKey.parse("invalid/idempotency-before-message"),
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.publish(
        publication(scope, {
          classifications: ["personal", "personal"],
          idempotencyKey: QueueIdempotencyKey.parse("invalid/duplicate-classes"),
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
    await expect(
      adapter.publish(
        publication(scope, {
          expiresAt: EpochMilliseconds.parse(1_000),
          idempotencyKey: QueueIdempotencyKey.parse("invalid/expiry"),
        }),
      ),
    ).rejects.toMatchObject({ code: "invalid" });
  });

  it("redacts normalized errors", () => {
    const error = new DurableQueueError("publish", "unavailable");
    expect(error.retryable).toBe(true);
    expect(JSON.stringify(error)).toBe(
      '{"code":"unavailable","operation":"publish","retryable":true}',
    );
    expect(new DurableQueueError("publish", "invalid").retryable).toBe(false);
  });
});
