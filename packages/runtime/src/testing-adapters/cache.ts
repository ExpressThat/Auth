import type {
  AtomicCounterResult,
  CacheEntry,
  CacheHealth,
  CacheMutationResult,
  CacheStateProvider,
  Clock,
  CompareAndSetCacheRequest,
  DeleteCacheRequest,
  GetCacheRequest,
  IncrementCacheRequest,
  PutCacheRequest,
} from "../index.js";
import { CacheStateError, CacheValue, CacheVersion } from "../index.js";

type ByteRecord = {
  expiresAt: CacheEntry["expiresAt"];
  kind: "bytes";
  value: Uint8Array;
  version: number;
};
type CounterRecord = {
  expiresAt: CacheEntry["expiresAt"];
  kind: "counter";
  value: number;
  version: number;
};
type RecordValue = ByteRecord | CounterRecord;

export class TestCacheBackend {
  public readonly records = new Map<string, RecordValue>();
  public available = true;
  public degraded = false;
}

export class TestCacheStateAdapter implements CacheStateProvider {
  readonly #backend: TestCacheBackend;
  readonly #clock: Clock;

  public constructor(clock: Clock, backend = new TestCacheBackend()) {
    this.#clock = clock;
    this.#backend = backend;
  }

  public async compareAndSet(request: CompareAndSetCacheRequest): Promise<CacheMutationResult> {
    this.#requireAvailable("compare-and-set");
    this.#requireFutureExpiry(request.expiresAt, "compare-and-set");
    const record = this.#liveRecord(request.key.providerKey());
    if (!record) {
      return { outcome: "not-found" };
    }
    if (record.kind !== "bytes" || record.version !== request.expectedVersion.numberValue()) {
      return { outcome: "version-mismatch" };
    }
    const next = this.#byteRecord(request.value, request.expiresAt, record.version + 1);
    this.#backend.records.set(request.key.providerKey(), next);
    return { entry: this.#entry(next), outcome: "applied" };
  }

  public async delete(request: DeleteCacheRequest): Promise<CacheMutationResult> {
    this.#requireAvailable("delete");
    const providerKey = request.key.providerKey();
    const record = this.#liveRecord(providerKey);
    if (!record) {
      return { outcome: "not-found" };
    }
    if (
      request.expectedVersion !== undefined &&
      request.expectedVersion.numberValue() !== record.version
    ) {
      return { outcome: "version-mismatch" };
    }
    this.#backend.records.delete(providerKey);
    return record.kind === "bytes"
      ? { entry: this.#entry(record), outcome: "applied" }
      : { outcome: "applied" };
  }

  public async get(request: GetCacheRequest): Promise<CacheEntry | undefined> {
    this.#requireAvailable("get");
    const record = this.#liveRecord(request.key.providerKey());
    if (record?.kind !== "bytes") {
      return undefined;
    }
    return this.#entry(record);
  }

  public async health(): Promise<CacheHealth> {
    return {
      checkedAt: this.#clock.now(),
      status: this.#backend.available
        ? this.#backend.degraded
          ? "degraded"
          : "healthy"
        : "unavailable",
      supportsAtomicOperations: true,
    };
  }

  public async increment(request: IncrementCacheRequest): Promise<AtomicCounterResult> {
    this.#requireAvailable("increment");
    this.#requireFutureExpiry(request.expiresAt, "increment");
    this.#requireCounter(request.delta);
    this.#requireCounter(request.initialValue);
    const providerKey = request.key.providerKey();
    const record = this.#liveRecord(providerKey);
    if (record?.kind === "bytes") {
      throw new CacheStateError("increment", "conflict");
    }
    const current = record?.value ?? request.initialValue;
    const nextValue = current + request.delta;
    this.#requireCounter(nextValue, "overflow");
    const next: CounterRecord = {
      expiresAt: request.expiresAt,
      kind: "counter",
      value: nextValue,
      version: (record?.version ?? 0) + 1,
    };
    this.#backend.records.set(providerKey, next);
    return {
      expiresAt: next.expiresAt,
      value: next.value,
      version: CacheVersion.parse(next.version),
    };
  }

  public async put(request: PutCacheRequest): Promise<CacheEntry> {
    this.#requireAvailable("put");
    this.#requireFutureExpiry(request.expiresAt, "put");
    const providerKey = request.key.providerKey();
    const existing = this.#liveRecord(providerKey);
    const next = this.#byteRecord(request.value, request.expiresAt, (existing?.version ?? 0) + 1);
    this.#backend.records.set(providerKey, next);
    return this.#entry(next);
  }

  #byteRecord(value: CacheValue, expiresAt: CacheEntry["expiresAt"], version: number): ByteRecord {
    return {
      expiresAt,
      kind: "bytes",
      value: value.copyForProvider(),
      version,
    };
  }

  #entry(record: ByteRecord): CacheEntry {
    return {
      expiresAt: record.expiresAt,
      value: CacheValue.fromBytes(record.value),
      version: CacheVersion.parse(record.version),
    };
  }

  #liveRecord(providerKey: string): RecordValue | undefined {
    const record = this.#backend.records.get(providerKey);
    if (record && record.expiresAt.compare(this.#clock.now()) <= 0) {
      this.#backend.records.delete(providerKey);
      return undefined;
    }
    return record;
  }

  #requireAvailable(operation: "compare-and-set" | "delete" | "get" | "increment" | "put"): void {
    if (!this.#backend.available) {
      throw new CacheStateError(operation, "unavailable");
    }
  }

  #requireCounter(value: number, code: "invalid" | "overflow" = "invalid"): void {
    if (!Number.isSafeInteger(value)) {
      throw new CacheStateError("increment", code);
    }
  }

  #requireFutureExpiry(
    expiresAt: CacheEntry["expiresAt"],
    operation: "compare-and-set" | "increment" | "put",
  ): void {
    if (expiresAt.compare(this.#clock.now()) <= 0) {
      throw new CacheStateError(operation, "expired");
    }
  }
}
