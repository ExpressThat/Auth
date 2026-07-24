import { type RandomSource, requireRandomByteLength } from "./random.js";
import { type Clock, EpochMilliseconds } from "./time.js";

export { TestCacheBackend, TestCacheStateAdapter } from "./testing-adapters/cache.js";
export { TestCertificateAutomationAdapter } from "./testing-adapters/certificate-automation.js";
export { TestWebCryptoAdapter } from "./testing-adapters/cryptography.js";
export { TestFrontendDeploymentAdapter } from "./testing-adapters/deployment-automation.js";
export { TestDnsAutomationAdapter } from "./testing-adapters/dns-automation.js";
export {
  requireEcPublicMembers,
  requireRsaPublicMembers,
} from "./testing-adapters/key-crypto.js";
export { TestKeyManagementAdapter } from "./testing-adapters/key-management.js";
export {
  createTestRuntimeCapabilityComposition,
  TEST_RUNTIME_CAPABILITY_MANIFEST,
} from "./testing-adapters/manifest.js";
export {
  readObjectBody,
  TestObjectBody,
} from "./testing-adapters/object-body.js";
export {
  TestObjectBackend,
  TestObjectStorageAdapter,
} from "./testing-adapters/object-storage.js";
export { TestObservabilityAdapter } from "./testing-adapters/observability.js";
export { TestTraceSpan } from "./testing-adapters/observability-span.js";
export {
  TestDurableQueueAdapter,
  TestQueueBackend,
} from "./testing-adapters/queue.js";
export { TestSecretStorageAdapter } from "./testing-adapters/secret.js";

export class ControlledClock implements Clock {
  #current: EpochMilliseconds;

  public constructor(initialMilliseconds = 0) {
    this.#current = EpochMilliseconds.parse(initialMilliseconds);
  }

  public advance(milliseconds: number): void {
    if (!Number.isSafeInteger(milliseconds) || milliseconds < 0) {
      throw new RangeError("Clock advance must be a non-negative safe integer.");
    }
    this.#current = EpochMilliseconds.parse(Number(this.#current) + milliseconds);
  }

  public now(): EpochMilliseconds {
    return this.#current;
  }

  public set(milliseconds: number): void {
    this.#current = EpochMilliseconds.parse(milliseconds);
  }
}

export class SequenceRandomSource implements RandomSource {
  readonly #values: Uint8Array[];
  #index = 0;

  public constructor(values: readonly Uint8Array[]) {
    this.#values = values.map((value) => Uint8Array.from(value));
  }

  public bytes(length: number): Uint8Array {
    requireRandomByteLength(length);
    const selected = this.#values[this.#index];

    if (selected === undefined) {
      throw new Error("Deterministic random sequence is exhausted.");
    }
    if (selected.length !== length) {
      throw new RangeError(
        `Expected ${String(length)} deterministic bytes, received ${String(selected.length)}.`,
      );
    }

    this.#index += 1;
    return Uint8Array.from(selected);
  }

  public remaining(): number {
    return this.#values.length - this.#index;
  }
}
