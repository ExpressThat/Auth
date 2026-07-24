export type AttemptResult<T> =
  | { index: number; status: "fulfilled"; value: T }
  | { error: unknown; index: number; status: "rejected" };

export async function runConcurrentAttempts<T>(
  attempts: number,
  operation: (index: number) => Promise<T>,
): Promise<Array<AttemptResult<T>>> {
  if (!Number.isSafeInteger(attempts) || attempts < 2 || attempts > 1_000) {
    throw new RangeError("Concurrent attempt count must be between 2 and 1000.");
  }

  const gate = Promise.withResolvers<void>();
  const pending: Array<Promise<AttemptResult<T>>> = Array.from(
    { length: attempts },
    async (_unused, index): Promise<AttemptResult<T>> => {
      await gate.promise;
      try {
        return { index, status: "fulfilled", value: await operation(index) };
      } catch (error: unknown) {
        return { error, index, status: "rejected" };
      }
    },
  );

  gate.resolve();
  return Promise.all(pending);
}

export async function runReplayAttempts<TInput, TResult>(
  attempts: number,
  input: TInput,
  operation: (input: TInput, index: number) => Promise<TResult>,
): Promise<Array<AttemptResult<TResult>>> {
  return runConcurrentAttempts(attempts, (index) => operation(input, index));
}
