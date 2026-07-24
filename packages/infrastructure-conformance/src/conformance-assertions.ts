export interface NormalizedAdapterError {
  readonly code: string;
  readonly operation: string;
  readonly retryable: boolean;
  toJSON(): unknown;
}

export function assertNormalizedAdapterError(
  value: unknown,
  expectedRetryable: boolean,
): asserts value is NormalizedAdapterError {
  if (
    value === null ||
    typeof value !== "object" ||
    typeof Reflect.get(value, "code") !== "string" ||
    typeof Reflect.get(value, "operation") !== "string" ||
    Reflect.get(value, "retryable") !== expectedRetryable ||
    typeof Reflect.get(value, "toJSON") !== "function"
  ) {
    throw new Error("Adapter failure is not normalized.");
  }
}

export function assertNoSecretLeak(value: unknown, secrets: readonly string[]): string {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new Error("Adapter diagnostic is not safely serializable.");
  }
  if (serialized === undefined) {
    throw new Error("Adapter diagnostic has no serialized representation.");
  }
  if (secrets.some((secret) => secret.length === 0 || serialized.includes(secret))) {
    throw new Error("Adapter diagnostic contains secret material.");
  }
  return serialized;
}

export async function captureAdapterFailure(operation: () => Promise<unknown>): Promise<unknown> {
  try {
    await operation();
  } catch (error: unknown) {
    return error;
  }
  throw new Error("Adapter operation did not fail as required.");
}

export function assertConcurrentSuccess(
  results: readonly PromiseSettledResult<unknown>[],
  expected: number,
): void {
  if (results.length !== expected || results.some((result) => result.status !== "fulfilled")) {
    throw new Error("Concurrent adapter operations did not all succeed.");
  }
}
