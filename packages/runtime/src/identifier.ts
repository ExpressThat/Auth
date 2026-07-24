import type { RandomSource } from "./random.js";
import type { Clock } from "./time.js";

const UUID_V7_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

export const ENTITY_PREFIXES = ["app", "env", "evt", "job", "org", "uorg", "usr"] as const;
export type EntityPrefix = (typeof ENTITY_PREFIXES)[number];

export class EntityId {
  readonly #value: string;

  private constructor(value: string) {
    this.#value = value;
  }

  public static parse(value: unknown): EntityId {
    if (typeof value !== "string" || !UUID_V7_PATTERN.test(value)) {
      throw new TypeError("Entity identifier must be a canonical lowercase UUIDv7.");
    }
    return new EntityId(value);
  }

  public toJSON(): string {
    return this.#value;
  }

  public toString(): string {
    return this.#value;
  }
}

export class PublicEntityId<TPrefix extends EntityPrefix = EntityPrefix> {
  readonly #entityId: EntityId;
  public readonly prefix: TPrefix;

  private constructor(prefix: TPrefix, entityId: EntityId) {
    this.prefix = prefix;
    this.#entityId = entityId;
  }

  public static create<TPrefix extends EntityPrefix>(
    prefix: TPrefix,
    entityId: EntityId,
  ): PublicEntityId<TPrefix> {
    return new PublicEntityId(prefix, entityId);
  }

  public static parse<TPrefix extends EntityPrefix>(
    prefix: TPrefix,
    value: unknown,
  ): PublicEntityId<TPrefix> {
    const marker = `${prefix}_`;
    if (typeof value !== "string" || !value.startsWith(marker)) {
      throw new TypeError(`Public identifier must use the ${prefix}_ prefix.`);
    }
    return new PublicEntityId(prefix, EntityId.parse(value.slice(marker.length)));
  }

  public entityId(): EntityId {
    return this.#entityId;
  }

  public toJSON(): string {
    return this.toString();
  }

  public toString(): string {
    return `${this.prefix}_${this.#entityId.toString()}`;
  }
}

export interface IdentifierGenerator {
  next(): EntityId;
}

export class UuidV7Generator implements IdentifierGenerator {
  readonly #clock: Clock;
  readonly #random: RandomSource;

  public constructor(clock: Clock, random: RandomSource) {
    this.#clock = clock;
    this.#random = random;
  }

  public next(): EntityId {
    const bytes = new Uint8Array(16);
    let remainingTimestamp = Number(this.#clock.now());

    for (let index = 5; index >= 0; index -= 1) {
      bytes[index] = remainingTimestamp % 256;
      remainingTimestamp = Math.floor(remainingTimestamp / 256);
    }
    const randomBytes = this.#random.bytes(10);
    if (randomBytes.length !== 10) {
      throw new Error("Random source violated the requested byte-length contract.");
    }
    bytes.set(randomBytes, 6);
    const view = new DataView(bytes.buffer);
    view.setUint8(6, (view.getUint8(6) & 0x0f) | 0x70);
    view.setUint8(8, (view.getUint8(8) & 0x3f) | 0x80);

    const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
    const value = [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
    return EntityId.parse(value);
  }
}
