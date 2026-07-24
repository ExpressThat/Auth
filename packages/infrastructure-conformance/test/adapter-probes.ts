import { createTestRuntimeCapabilityComposition } from "@expressthat-auth/runtime/testing";
import {
  assertConcurrentSuccess,
  assertNormalizedAdapterError,
  assertNoSecretLeak,
  type ConformanceProbe,
  type CustodyConformanceProbes,
  captureAdapterFailure,
  type StatefulConformanceProbes,
} from "../src/index.js";

type AdapterProbeActions = {
  readonly concurrency: () => Promise<readonly PromiseSettledResult<unknown>[]>;
  readonly failure: () => Promise<unknown>;
  readonly redaction: () => Promise<unknown>;
  readonly residency: () => Promise<void>;
  readonly retry: () => Promise<unknown>;
  readonly success: () => Promise<void>;
};

type StatefulAdapterProbeActions = AdapterProbeActions & {
  readonly health: () => Promise<void>;
};

const CANARY = "conformance-secret-canary";

function probe(name: string, run: ConformanceProbe["run"]): ConformanceProbe {
  return { name, run };
}

function common(actions: AdapterProbeActions): CustodyConformanceProbes {
  return {
    concurrency: probe("supports concurrent operations", async () => {
      const results = await actions.concurrency();
      assertConcurrentSuccess(results, results.length);
    }),
    failure: probe("normalizes permanent failures", async () => {
      assertNormalizedAdapterError(await captureAdapterFailure(actions.failure), false);
    }),
    redaction: probe("redacts sensitive diagnostics", async () => {
      assertNoSecretLeak(await actions.redaction(), [CANARY]);
    }),
    residency: probe("enforces residency policy", async () => {
      await actions.residency();
    }),
    retry: probe("classifies transient failures", async () => {
      assertNormalizedAdapterError(await captureAdapterFailure(actions.retry), true);
    }),
    runtime: probe("supports the declared runtime", async () => {
      const composition = createTestRuntimeCapabilityComposition();
      assertNoSecretLeak(composition, [CANARY]);
    }),
    success: probe("completes the primary lifecycle", async () => {
      await actions.success();
    }),
    timeout: probe("completes within the operation budget", async ({ signal }) => {
      await actions.success();
      if (signal.aborted) {
        throw new Error("Adapter exceeded the conformance operation budget.");
      }
    }),
  };
}

export function custodyAdapterProbes(actions: AdapterProbeActions): CustodyConformanceProbes {
  return common(actions);
}

export function statefulAdapterProbes(
  actions: StatefulAdapterProbeActions,
): StatefulConformanceProbes {
  return {
    ...common(actions),
    health: probe("reports dependency health", async () => {
      await actions.health();
    }),
  };
}

export function conformanceCanary(): string {
  return CANARY;
}
