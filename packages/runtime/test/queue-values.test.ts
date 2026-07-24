import { describe, expect, it } from "vitest";
import {
  EntityId,
  MAX_QUEUE_LEASE_MILLISECONDS,
  MAX_QUEUE_PAYLOAD_BYTES,
  PublicEntityId,
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
} from "../src/index.js";

const id = EntityId.parse("01234567-89ab-7001-8203-040506070801");
const org = PublicEntityId.create("org", id);
const env = PublicEntityId.create("env", id);
const app = PublicEntityId.create("app", id);

describe("durable queue values", () => {
  it("validates bounded names, versions, attempts, and lease durations", () => {
    expect(QueueName.parse("jobs.email").identifier()).toBe("jobs.email");
    expect(QueueMessageType.parse("email.send").identifier()).toBe("email.send");
    expect(QueueSchemaVersion.parse(1).numberValue()).toBe(1);
    expect(QueueDeliveryAttempt.parse(1).numberValue()).toBe(1);
    expect(QueueDeliveryLimit.parse(1).numberValue()).toBe(1);
    expect(QueueLeaseDuration.milliseconds(1).numberValue()).toBe(1);
    expect(QueueLeaseDuration.milliseconds(MAX_QUEUE_LEASE_MILLISECONDS).numberValue()).toBe(
      MAX_QUEUE_LEASE_MILLISECONDS,
    );
    expect(() => QueueName.parse("contains spaces")).toThrow(TypeError);
    expect(() => QueueName.parse("x".repeat(201))).toThrow(TypeError);
    expect(() => QueueName.parse(1)).toThrow(TypeError);
    expect(() => QueueSchemaVersion.parse(0)).toThrow(TypeError);
    expect(() => QueueSchemaVersion.parse(1.5)).toThrow(TypeError);
    expect(() => QueueSchemaVersion.parse("1")).toThrow(TypeError);
    expect(() => QueueLeaseDuration.milliseconds(0)).toThrow(TypeError);
    expect(() => QueueLeaseDuration.milliseconds(MAX_QUEUE_LEASE_MILLISECONDS + 1)).toThrow(
      TypeError,
    );
  });

  it("copies and redacts payloads, lease tokens, and idempotency keys", () => {
    const source = new Uint8Array([1, 2, 3]);
    const payload = QueuePayload.fromBytes(source);
    source[0] = 9;
    const copy = payload.copyForProvider();
    copy[1] = 9;

    expect([...payload.copyForProvider()]).toEqual([1, 2, 3]);
    expect(payload.byteLength()).toBe(3);
    expect(JSON.stringify(payload)).toBe('"[REDACTED QUEUE PAYLOAD]"');
    expect(JSON.stringify(QueueLeaseToken.parse("lease/one"))).toBe(
      '"[REDACTED QUEUE LEASE TOKEN]"',
    );
    expect(JSON.stringify(QueueIdempotencyKey.parse("event/one"))).toBe(
      '"[REDACTED QUEUE IDEMPOTENCY KEY]"',
    );
    expect(QueuePayload.fromBytes(new Uint8Array(MAX_QUEUE_PAYLOAD_BYTES)).byteLength()).toBe(
      MAX_QUEUE_PAYLOAD_BYTES,
    );
    expect(() => QueuePayload.fromBytes(new Uint8Array())).toThrow(TypeError);
    expect(() => QueuePayload.fromBytes(new Uint8Array(MAX_QUEUE_PAYLOAD_BYTES + 1))).toThrow(
      TypeError,
    );
    expect(() => QueuePayload.fromBytes("payload")).toThrow(TypeError);
  });

  it("enforces a trusted organisation, environment, application hierarchy", () => {
    const scoped = QueueScope.create({
      applicationId: app,
      customerOrganisationId: org,
      environmentId: env,
    });
    const management = QueueScope.create({ customerOrganisationId: org });

    expect(scoped.applicationId()).toBe(app);
    expect(scoped.environmentId()).toBe(env);
    expect(scoped.customerOrganisationId()).toBe(org);
    expect(scoped.providerPartition()).not.toBe(management.providerPartition());
    expect(JSON.stringify(scoped)).toBe('"[REDACTED QUEUE SCOPE]"');
    expect(() =>
      QueueScope.create({
        applicationId: app,
        customerOrganisationId: org,
      }),
    ).toThrow(TypeError);
    expect(() =>
      QueueScope.create({
        // @ts-expect-error -- exercise runtime trust-plane validation.
        customerOrganisationId: env,
      }),
    ).toThrow(TypeError);
    expect(() =>
      QueueScope.create({
        customerOrganisationId: org,
        // @ts-expect-error -- exercise runtime trust-plane validation.
        environmentId: org,
      }),
    ).toThrow(TypeError);
    expect(() =>
      QueueScope.create({
        // @ts-expect-error -- exercise forged-object validation.
        customerOrganisationId: {
          prefix: "org",
          toString: () => org.toString(),
        },
      }),
    ).toThrow(TypeError);
  });
});
