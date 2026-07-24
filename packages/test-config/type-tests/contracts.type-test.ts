import {
  ControlledClock,
  type RuntimeSchema,
  type SchemaCases,
  SequenceRandom,
} from "@expressthat-auth/test-config";
import { createUnitTestConfig } from "@expressthat-auth/test-config/vitest";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<Condition extends true> = Condition;

export type ClockReturnIsNumber = Assert<Equal<ReturnType<ControlledClock["now"]>, number>>;
export type RandomReturnIsBytes = Assert<Equal<ReturnType<SequenceRandom["bytes"]>, Uint8Array>>;

export const clockResult: number = new ControlledClock(10).now();
export const randomResult: Uint8Array = new SequenceRandom([new Uint8Array([1])]).bytes(1);
export const schemaCases = {
  invalid: [null],
  valid: [{ value: "accepted" }],
} satisfies SchemaCases;
export const runtimeSchema = {
  safeParse: () => ({ success: true }),
} satisfies RuntimeSchema;
export const unitConfig = createUnitTestConfig({ test: { environment: "node" } });

// @ts-expect-error -- clock instants cannot be strings.
new ControlledClock("10");
// @ts-expect-error -- deterministic random values must be byte arrays.
new SequenceRandom([[1, 2]]);
// @ts-expect-error -- schema case groups are arrays.
export const invalidCases: SchemaCases = { invalid: null, valid: [] };
// @ts-expect-error -- the schema result must declare success.
export const invalidSchema: RuntimeSchema = { safeParse: () => ({}) };
// @ts-expect-error -- invalid Vitest environments must be rejected.
createUnitTestConfig({ test: { environment: 123 } });
