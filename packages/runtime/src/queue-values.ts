import { PublicEntityId } from "./identifier.js";

export const MAX_QUEUE_PAYLOAD_BYTES = 1_048_576;
export const MAX_QUEUE_LEASE_MILLISECONDS = 900_000;
const MAX_SEGMENT_LENGTH = 200;

function parseSegment(value: unknown, label: string): string {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > MAX_SEGMENT_LENGTH ||
    !/^[A-Za-z0-9._:/-]+$/u.test(value)
  ) {
    throw new TypeError(`${label} must use the bounded opaque format.`);
  }
  return value;
}

abstract class QueueStringValue {
  readonly #value: string;

  protected constructor(value: unknown, label: string) {
    this.#value = parseSegment(value, label);
  }

  public identifier(): string {
    return this.#value;
  }
}

export class QueueName extends QueueStringValue {
  private constructor(value: unknown) {
    super(value, "Queue name");
  }

  public static parse(value: unknown): QueueName {
    return new QueueName(value);
  }
}

export class QueueMessageType extends QueueStringValue {
  private constructor(value: unknown) {
    super(value, "Queue message type");
  }

  public static parse(value: unknown): QueueMessageType {
    return new QueueMessageType(value);
  }
}

export class QueueIdempotencyKey extends QueueStringValue {
  private constructor(value: unknown) {
    super(value, "Queue idempotency key");
  }

  public static parse(value: unknown): QueueIdempotencyKey {
    return new QueueIdempotencyKey(value);
  }

  public toJSON(): string {
    return "[REDACTED QUEUE IDEMPOTENCY KEY]";
  }
}

export class QueueLeaseToken extends QueueStringValue {
  private constructor(value: unknown) {
    super(value, "Queue lease token");
  }

  public static parse(value: unknown): QueueLeaseToken {
    return new QueueLeaseToken(value);
  }

  public toJSON(): string {
    return "[REDACTED QUEUE LEASE TOKEN]";
  }
}

abstract class PositiveQueueInteger {
  readonly #value: number;

  protected constructor(value: unknown, label: string, maximum = Number.MAX_SAFE_INTEGER) {
    if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 1 || value > maximum) {
      throw new TypeError(`${label} must be a bounded positive safe integer.`);
    }
    this.#value = value;
  }

  public numberValue(): number {
    return this.#value;
  }
}

export class QueueSchemaVersion extends PositiveQueueInteger {
  private constructor(value: unknown) {
    super(value, "Queue schema version");
  }

  public static parse(value: unknown): QueueSchemaVersion {
    return new QueueSchemaVersion(value);
  }
}

export class QueueDeliveryAttempt extends PositiveQueueInteger {
  private constructor(value: unknown) {
    super(value, "Queue delivery attempt");
  }

  public static parse(value: unknown): QueueDeliveryAttempt {
    return new QueueDeliveryAttempt(value);
  }
}

export class QueueDeliveryLimit extends PositiveQueueInteger {
  private constructor(value: unknown) {
    super(value, "Queue delivery limit");
  }

  public static parse(value: unknown): QueueDeliveryLimit {
    return new QueueDeliveryLimit(value);
  }
}

export class QueueLeaseDuration extends PositiveQueueInteger {
  private constructor(value: unknown) {
    super(value, "Queue lease duration", MAX_QUEUE_LEASE_MILLISECONDS);
  }

  public static milliseconds(value: unknown): QueueLeaseDuration {
    return new QueueLeaseDuration(value);
  }
}

export class QueuePayload {
  readonly #bytes: Uint8Array;

  private constructor(value: Uint8Array) {
    this.#bytes = Uint8Array.from(value);
  }

  public static fromBytes(value: unknown): QueuePayload {
    if (
      !(value instanceof Uint8Array) ||
      value.length < 1 ||
      value.length > MAX_QUEUE_PAYLOAD_BYTES
    ) {
      throw new TypeError("Queue payload must be a bounded non-empty byte array.");
    }
    return new QueuePayload(value);
  }

  public byteLength(): number {
    return this.#bytes.length;
  }

  public copyForProvider(): Uint8Array {
    return Uint8Array.from(this.#bytes);
  }

  public toJSON(): string {
    return "[REDACTED QUEUE PAYLOAD]";
  }
}

export interface QueueScopeInput {
  readonly applicationId?: PublicEntityId<"app">;
  readonly customerOrganisationId: PublicEntityId<"org">;
  readonly environmentId?: PublicEntityId<"env">;
}

export class QueueScope {
  readonly #applicationId: PublicEntityId<"app"> | undefined;
  readonly #customerOrganisationId: PublicEntityId<"org">;
  readonly #environmentId: PublicEntityId<"env"> | undefined;

  private constructor(input: QueueScopeInput) {
    this.#applicationId = input.applicationId;
    this.#customerOrganisationId = input.customerOrganisationId;
    this.#environmentId = input.environmentId;
  }

  public static create(input: QueueScopeInput): QueueScope {
    if (
      !(input.customerOrganisationId instanceof PublicEntityId) ||
      input.customerOrganisationId.prefix !== "org" ||
      (input.environmentId !== undefined &&
        (!(input.environmentId instanceof PublicEntityId) ||
          input.environmentId.prefix !== "env")) ||
      (input.applicationId !== undefined &&
        (!(input.applicationId instanceof PublicEntityId) ||
          input.applicationId.prefix !== "app")) ||
      (input.applicationId !== undefined && input.environmentId === undefined)
    ) {
      throw new TypeError("Queue scope must contain a valid trusted identifier hierarchy.");
    }
    return new QueueScope(input);
  }

  public applicationId(): PublicEntityId<"app"> | undefined {
    return this.#applicationId;
  }

  public customerOrganisationId(): PublicEntityId<"org"> {
    return this.#customerOrganisationId;
  }

  public environmentId(): PublicEntityId<"env"> | undefined {
    return this.#environmentId;
  }

  public providerPartition(): string {
    const fields = [
      this.#customerOrganisationId.toString(),
      this.#environmentId?.toString() ?? "-",
      this.#applicationId?.toString() ?? "-",
    ];
    return fields.map((field) => `${String(field.length)}:${field}`).join("|");
  }

  public toJSON(): string {
    return "[REDACTED QUEUE SCOPE]";
  }
}
