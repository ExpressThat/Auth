import { describe, expect, it } from "vitest";
import {
  assertConcurrentSuccess,
  assertNormalizedAdapterError,
  assertNoSecretLeak,
  captureAdapterFailure,
} from "../src/index.js";

function normalizedError(retryable: boolean): Error & {
  code: string;
  operation: string;
  retryable: boolean;
  toJSON(): unknown;
} {
  return Object.assign(new Error("safe"), {
    code: "unavailable",
    operation: "get",
    retryable,
    toJSON: () => ({ code: "unavailable", operation: "get", retryable }),
  });
}

describe("infrastructure conformance assertions", () => {
  it("captures and validates retryable and permanent normalized failures", async () => {
    const transient = await captureAdapterFailure(async () => {
      throw normalizedError(true);
    });
    const permanent = await captureAdapterFailure(async () => {
      throw normalizedError(false);
    });

    expect(() => assertNormalizedAdapterError(transient, true)).not.toThrow();
    expect(() => assertNormalizedAdapterError(permanent, false)).not.toThrow();
    await expect(captureAdapterFailure(async () => {})).rejects.toThrow("did not fail");
  });

  it.each([
    null,
    {},
    { code: 1, operation: "get", retryable: true, toJSON: () => ({}) },
    { code: "x", operation: 1, retryable: true, toJSON: () => ({}) },
    { code: "x", operation: "get", retryable: false, toJSON: () => ({}) },
    { code: "x", operation: "get", retryable: true, toJSON: true },
  ])("rejects a non-normalized adapter error", (value) => {
    expect(() => assertNormalizedAdapterError(value, true)).toThrow("not normalized");
  });

  it("accepts safe serialized diagnostics and rejects leaks", () => {
    expect(assertNoSecretLeak({ code: "safe" }, ["synthetic-secret"])).toBe('{"code":"safe"}');
    expect(() => assertNoSecretLeak({ value: "synthetic-secret" }, ["synthetic-secret"])).toThrow(
      "secret material",
    );
    expect(() => assertNoSecretLeak({}, [""])).toThrow("secret material");
    expect(() => assertNoSecretLeak(undefined, ["secret"])).toThrow("no serialized");
    const circular: { self?: unknown } = {};
    circular.self = circular;
    expect(() => assertNoSecretLeak(circular, ["secret"])).toThrow("not safely serializable");
  });

  it("requires every concurrent result to fulfill", () => {
    const fulfilled = [
      { status: "fulfilled", value: 1 },
      { status: "fulfilled", value: 2 },
    ] as const;
    const rejected = [
      ...fulfilled.slice(0, 1),
      { reason: new Error("failure"), status: "rejected" },
    ] as const;

    expect(() => assertConcurrentSuccess(fulfilled, 2)).not.toThrow();
    expect(() => assertConcurrentSuccess(fulfilled, 3)).toThrow("did not all succeed");
    expect(() => assertConcurrentSuccess(rejected, 2)).toThrow("did not all succeed");
  });
});
