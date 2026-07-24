import { describe, expect, it } from "vitest";
import {
  composeRuntimeDependencies,
  RUNTIME_DEPENDENCY_CAPABILITIES,
  RuntimeDependencyCompositionError,
} from "../src/index.js";
import { runtimeDependencyInput, unrelatedManifest } from "./dependency-test-fixture.js";

function replace(target: object, property: string, value: unknown): void {
  Object.defineProperty(target, property, { configurable: true, value });
}

function replaceProviderMethod(
  input: object,
  bindingName: string,
  method: string,
  value: unknown = undefined,
): void {
  const binding = Reflect.get(input, bindingName);
  if (binding === null || typeof binding !== "object") {
    throw new TypeError("Test binding is invalid.");
  }
  const provider = Reflect.get(binding, "provider");
  if (provider === null || typeof provider !== "object") {
    throw new TypeError("Test provider is invalid.");
  }
  replace(provider, method, value);
}

describe("runtime dependency composition", () => {
  it("creates a frozen redacting set with the exact validated providers", () => {
    const input = runtimeDependencyInput();
    const dependencies = composeRuntimeDependencies(input);

    expect(dependencies.authenticatedEncryption).toBe(input.authenticatedEncryption.provider);
    expect(dependencies.cacheState).toBe(input.cacheState.provider);
    expect(dependencies.clock).toBe(input.clock);
    expect(dependencies.durableQueue).toBe(input.durableQueue.provider);
    expect(dependencies.identifiers).toBe(input.identifiers);
    expect(dependencies.keyManagement).toBe(input.keyManagement.provider);
    expect(dependencies.objectStorage).toBe(input.objectStorage.provider);
    expect(dependencies.observability).toBe(input.observability.provider);
    expect(dependencies.passwordHasher).toBe(input.passwordHasher.provider);
    expect(dependencies.random).toBe(input.random);
    expect(dependencies.secretStorage).toBe(input.secretStorage.provider);
    expect(dependencies.signing).toBe(input.signing.provider);
    expect(dependencies.toJSON()).toEqual({ redacted: true });
    expect(Object.isFrozen(dependencies)).toBe(true);
    expect(Object.isFrozen(RUNTIME_DEPENDENCY_CAPABILITIES)).toBe(true);
  });

  it.each([
    ["clock", "now"],
    ["identifiers", "next"],
    ["random", "bytes"],
  ])("rejects an invalid foundational %s dependency", (name, method) => {
    const input = runtimeDependencyInput();
    replace(Reflect.get(input, name), method, undefined);

    expect(() => composeRuntimeDependencies(input)).toThrow(
      expect.objectContaining({
        code: "invalid-dependency",
        dependency: name,
      }),
    );
  });

  it.each([
    ["authenticatedEncryption", "decrypt", "authenticated-encryption"],
    ["cacheState", "compareAndSet", "cache-state"],
    ["durableQueue", "acknowledge", "durable-queue"],
    ["keyManagement", "publish", "key-management"],
    ["objectStorage", "delete", "object-storage"],
    ["observability", "health", "observability"],
    ["passwordHasher", "hash", "password-hasher"],
    ["secretStorage", "create", "secret-storage"],
    ["signing", "sign", "signing"],
  ])("rejects malformed %s provider implementations", (bindingName, method, dependency) => {
    const input = runtimeDependencyInput();
    replaceProviderMethod(input, bindingName, method);

    expect(() => composeRuntimeDependencies(input)).toThrow(
      expect.objectContaining({
        code: "invalid-dependency",
        dependency,
      }),
    );
  });

  it("rejects non-object, callable, and unvalidated provider substitutions", () => {
    const invalidObject = runtimeDependencyInput();
    replace(invalidObject.signing, "provider", null);
    expect(() => composeRuntimeDependencies(invalidObject)).toThrow(
      expect.objectContaining({ code: "invalid-dependency", dependency: "signing" }),
    );

    const callable = runtimeDependencyInput();
    replace(callable.signing, "provider", () => undefined);
    expect(() => composeRuntimeDependencies(callable)).toThrow(
      expect.objectContaining({ code: "invalid-dependency", dependency: "signing" }),
    );

    const substituted = runtimeDependencyInput();
    replace(substituted.signing, "manifest", unrelatedManifest());
    expect(() => composeRuntimeDependencies(substituted)).toThrow(
      expect.objectContaining({ code: "unvalidated-binding", dependency: "signing" }),
    );

    const forged = runtimeDependencyInput();
    replace(forged.signing, "manifest", {});
    expect(() => composeRuntimeDependencies(forged)).toThrow(
      expect.objectContaining({ code: "unvalidated-binding", dependency: "signing" }),
    );
  });

  it("rejects an unvalidated capability composition", () => {
    const input = runtimeDependencyInput();
    replace(input, "capabilities", structuredClone(input.capabilities));

    expect(() => composeRuntimeDependencies(input)).toThrow(
      expect.objectContaining({
        code: "invalid-dependency",
        dependency: "capabilities",
      }),
    );
  });

  it("normalizes errors without provider or configuration details", () => {
    const error = new RuntimeDependencyCompositionError("unvalidated-binding", "secret-storage");

    expect(error.name).toBe("RuntimeDependencyCompositionError");
    expect(error.message).toBe("Runtime dependency composition failed (unvalidated-binding).");
    expect(error.toJSON()).toEqual({
      code: "unvalidated-binding",
      dependency: "secret-storage",
    });
  });
});
