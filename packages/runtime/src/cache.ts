import type { CacheEntry, CacheKey, CacheValue, CacheVersion } from "./cache-values.js";
import type { EpochMilliseconds } from "./time.js";

export type CacheFailurePolicy = "deny-request" | "query-authoritative-source" | "reject-operation";
export type CacheOperation = "compare-and-set" | "delete" | "get" | "health" | "increment" | "put";
export type CacheErrorCode =
  | "conflict"
  | "expired"
  | "invalid"
  | "overflow"
  | "residency-violation"
  | "unavailable"
  | "unsupported";
export type CacheMutationOutcome = "applied" | "not-found" | "version-mismatch";
export type CacheHealthStatus = "degraded" | "healthy" | "unavailable";

interface CacheRequest {
  readonly failurePolicy: CacheFailurePolicy;
  readonly key: CacheKey;
}

export interface GetCacheRequest extends CacheRequest {}

export interface PutCacheRequest extends CacheRequest {
  readonly expiresAt: EpochMilliseconds;
  readonly value: CacheValue;
}

export interface CompareAndSetCacheRequest extends PutCacheRequest {
  readonly expectedVersion: CacheVersion;
}

export interface DeleteCacheRequest extends CacheRequest {
  readonly expectedVersion?: CacheVersion;
}

export interface IncrementCacheRequest extends CacheRequest {
  readonly delta: number;
  readonly expiresAt: EpochMilliseconds;
  readonly initialValue: number;
}

export interface AtomicCounterResult {
  readonly expiresAt: EpochMilliseconds;
  readonly value: number;
  readonly version: CacheVersion;
}

export interface CacheMutationResult {
  readonly entry?: CacheEntry;
  readonly outcome: CacheMutationOutcome;
}

export interface CacheHealth {
  readonly checkedAt: EpochMilliseconds;
  readonly status: CacheHealthStatus;
  readonly supportsAtomicOperations: boolean;
}

export interface CacheStateProvider {
  compareAndSet(request: CompareAndSetCacheRequest): Promise<CacheMutationResult>;
  delete(request: DeleteCacheRequest): Promise<CacheMutationResult>;
  get(request: GetCacheRequest): Promise<CacheEntry | undefined>;
  health(): Promise<CacheHealth>;
  increment(request: IncrementCacheRequest): Promise<AtomicCounterResult>;
  put(request: PutCacheRequest): Promise<CacheEntry>;
}

export class CacheStateError extends Error {
  public readonly code: CacheErrorCode;
  public readonly operation: CacheOperation;
  public readonly retryable: boolean;

  public constructor(operation: CacheOperation, code: CacheErrorCode) {
    super(`Cache state ${operation} failed (${code}).`);
    this.name = "CacheStateError";
    this.operation = operation;
    this.code = code;
    this.retryable = code === "unavailable";
  }

  public toJSON(): Readonly<{
    code: CacheErrorCode;
    operation: CacheOperation;
    retryable: boolean;
  }> {
    return {
      code: this.code,
      operation: this.operation,
      retryable: this.retryable,
    };
  }
}
