import {
  type Clock,
  EntityId,
  type IdentifierGenerator,
  PublicEntityId,
  type RandomSource,
  SystemClock,
  UuidV7Generator,
  WebCryptoRandomSource,
} from "@expressthat-auth/runtime";
import { ControlledClock, SequenceRandomSource } from "@expressthat-auth/runtime/testing";

export const clock: Clock = new SystemClock();
export const deterministicClock: Clock = new ControlledClock(0);
export const random: RandomSource = new WebCryptoRandomSource();
export const deterministicRandom: RandomSource = new SequenceRandomSource([new Uint8Array(10)]);
export const identifierGenerator: IdentifierGenerator = new UuidV7Generator(
  deterministicClock,
  deterministicRandom,
);
export const userId: PublicEntityId<"usr"> = PublicEntityId.create(
  "usr",
  EntityId.parse("01234567-89ab-7001-8203-040506070809"),
);

// @ts-expect-error -- public identifier prefixes come from the fixed registry.
PublicEntityId.parse("account", "account_01234567-89ab-7001-8203-040506070809");
// @ts-expect-error -- clocks return validated epoch-millisecond values.
export const invalidClock: Clock = { now: () => 1 };
// @ts-expect-error -- random sources return byte arrays.
export const invalidRandom: RandomSource = { bytes: () => "random" };
// @ts-expect-error -- a user-prefixed identifier is not an application identifier.
export const applicationId: PublicEntityId<"app"> = userId;
