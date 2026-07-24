import { describe, expect, it } from "vitest";
import {
  ENTITY_PREFIXES,
  EntityId,
  PublicEntityId,
  UuidV7Generator,
  WebCryptoRandomSource,
} from "../src/index.js";
import { ControlledClock, SequenceRandomSource } from "../src/testing.js";

const VECTOR_UUID = "01234567-89ab-7001-8203-040506070809";

function vectorGenerator(...randomValues: Uint8Array[]): UuidV7Generator {
  return new UuidV7Generator(
    new ControlledClock(0x01_23_45_67_89_ab),
    new SequenceRandomSource(randomValues),
  );
}

describe("UUIDv7 entity identifiers", () => {
  it("generates the expected RFC 9562 field layout", () => {
    const identifier = vectorGenerator(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])).next();

    expect(identifier.toString()).toBe(VECTOR_UUID);
    expect(identifier.toJSON()).toBe(VECTOR_UUID);
  });

  it("uses random bits for uniqueness during repeated clock values", () => {
    const generator = vectorGenerator(new Uint8Array(10), new Uint8Array(10).fill(1));

    expect(generator.next().toString()).not.toBe(generator.next().toString());
  });

  it("avoids collisions across replica-like generators at one instant", () => {
    const clock = new ControlledClock(1_000);
    const generators = Array.from(
      { length: 4 },
      () => new UuidV7Generator(clock, new WebCryptoRandomSource()),
    );
    const identifiers = generators.flatMap((generator) =>
      Array.from({ length: 128 }, () => generator.next().toString()),
    );

    expect(new Set(identifiers)).toHaveLength(512);
  });

  it("remains unique when a controlled clock moves backwards", () => {
    const clock = new ControlledClock(100);
    const generator = new UuidV7Generator(
      clock,
      new SequenceRandomSource([new Uint8Array(10), new Uint8Array(10).fill(2)]),
    );
    const first = generator.next();
    clock.set(99);

    expect(generator.next().toString()).not.toBe(first.toString());
  });

  it("fails closed when a random adapter violates its contract", () => {
    const generator = new UuidV7Generator(new ControlledClock(), {
      bytes: () => new Uint8Array(9),
    });

    expect(() => generator.next()).toThrow("Random source violated");
  });

  it.each([
    null,
    1,
    "01234567-89ab-4001-8203-040506070809",
    "01234567-89ab-7001-7203-040506070809",
    "01234567-89AB-7001-8203-040506070809",
    "not-a-uuid",
  ])("rejects non-canonical entity identifier %s", (value) => {
    expect(() => EntityId.parse(value)).toThrow(TypeError);
  });
});

describe("public entity identifiers", () => {
  it("round-trips every registered trust-specific prefix", () => {
    const entityId = EntityId.parse(VECTOR_UUID);

    for (const prefix of ENTITY_PREFIXES) {
      const created = PublicEntityId.create(prefix, entityId);
      const parsed = PublicEntityId.parse(prefix, created.toString());

      expect(parsed.prefix).toBe(prefix);
      expect(parsed.entityId().toString()).toBe(VECTOR_UUID);
      expect(parsed.toJSON()).toBe(`${prefix}_${VECTOR_UUID}`);
    }
  });

  it("rejects a prefix from another entity type", () => {
    expect(() => PublicEntityId.parse("usr", `org_${VECTOR_UUID}`)).toThrow(
      "Public identifier must use the usr_ prefix.",
    );
  });

  it.each([null, 10, "usr_not-a-uuid"])("rejects invalid public identifier %s", (value) => {
    expect(() => PublicEntityId.parse("usr", value)).toThrow(TypeError);
  });
});
