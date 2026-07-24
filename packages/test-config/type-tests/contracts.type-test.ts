import {
  ControlledClock,
  FixtureFactory,
  type ProviderOutcome,
  type RuntimeSchema,
  type SchemaCases,
  SequenceRandom,
} from "@expressthat-auth/test-config";
import {
  DeterministicRandom,
  type DockerSecurityTarget,
  type ReplicaIdentity,
  ReplicaStateConformanceSuite,
  type ReplicaStateProbes,
  type RuntimeSecurityCase,
  runConcurrentAttempts,
} from "@expressthat-auth/test-config/adversarial";
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
export const fixtureFactory = new FixtureFactory(new ControlledClock());
export const providerOutcome: ProviderOutcome<string> = fixtureFactory.providerSuccess("sent");
export const propertyInteger: number = new DeterministicRandom(1).integer(0, 10);
export const concurrentResult = runConcurrentAttempts(2, async (index) => index);
export const runtimeSecurityCase = {
  name: "denied",
  request: () => new Request("https://security.test"),
} satisfies RuntimeSecurityCase;
export const dockerSecurityTarget = {
  fetch: async () => new Response("ok"),
  instance: "primary",
} satisfies DockerSecurityTarget;
export declare const replicaStateProbes: ReplicaStateProbes;
export const replicaStateSuite = ReplicaStateConformanceSuite.define(replicaStateProbes, 1_000);
export const primaryReplica: ReplicaIdentity = { instance: "primary" };

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
// @ts-expect-error -- successful provider values retain their declared type.
export const invalidProviderOutcome: ProviderOutcome<number> = providerOutcome;
// @ts-expect-error -- concurrency attempt counts are numeric.
export const invalidConcurrentResult = runConcurrentAttempts("2", async () => undefined);
// @ts-expect-error -- runtime cases create Request objects.
export const invalidRuntimeCase: RuntimeSecurityCase = { name: "bad", request: () => "request" };
// @ts-expect-error -- every protected cross-replica state category is required.
export const invalidReplicaProbes: ReplicaStateProbes = {
  sessions: { name: "session visibility", run: async () => true },
};
// @ts-expect-error -- replica identities are a closed primary/secondary pair.
export const invalidReplicaIdentity: ReplicaIdentity = { instance: "tertiary" };
