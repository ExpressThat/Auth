import { describe, expect, it } from "vitest";
import { AdapterIdentifier, RuntimeCapability } from "../src/index.js";
import { OperatorAdapterSelection, OperatorAdapterSelectionError } from "../src/operator.js";

const capability = RuntimeCapability.parse("infrastructure/durable-queue");
const adapter = AdapterIdentifier.parse("reference/durable-state");

function validInput(): Parameters<typeof OperatorAdapterSelection.create>[0] {
  return {
    bindings: [{ adapter, capability }],
    platform: {
      containerArchitecture: "amd64",
      externalCapabilities: ["network/tls"],
      operatingSystem: "linux",
    },
    profile: "self-hosted",
    runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
  };
}

function replace(object: object, property: string, value: unknown): void {
  Object.defineProperty(object, property, { configurable: true, value });
}

describe("operator adapter selection", () => {
  it.each(["hosted", "local-development", "self-hosted"] as const)(
    "copies, freezes, and redacts a %s selection",
    (profile) => {
      const bindings = [{ adapter, capability }];
      const input = { ...validInput(), bindings, profile };
      const selected = OperatorAdapterSelection.create(input);
      bindings[0] = {
        adapter: AdapterIdentifier.parse("hostile/replacement"),
        capability,
      };

      expect(selected.profile).toBe(profile);
      expect(selected.bindings()[0]?.adapter).toBe(adapter);
      expect(Object.isFrozen(selected)).toBe(true);
      expect(Object.isFrozen(selected.bindings())).toBe(true);
      expect(JSON.stringify(selected)).toBe('{"bindings":1,"redacted":true}');
    },
  );

  it("rejects empty, duplicate, and forged bindings without echoing identifiers", () => {
    expect(() => OperatorAdapterSelection.create({ ...validInput(), bindings: [] })).toThrowError(
      expect.objectContaining({ code: "empty-selection" }),
    );
    expect(() =>
      OperatorAdapterSelection.create({
        ...validInput(),
        bindings: [
          ...validInput().bindings,
          {
            adapter: AdapterIdentifier.parse("reference/second"),
            capability,
          },
        ],
      }),
    ).toThrowError(expect.objectContaining({ code: "duplicate-capability" }));

    const forged = validInput();
    replace(forged.bindings[0] ?? {}, "adapter", {});
    const error = capture(() => OperatorAdapterSelection.create(forged));

    expect(error.code).toBe("invalid-binding");
    expect(JSON.stringify(error)).toBe('{"code":"invalid-binding"}');
    expect(error.message).not.toContain("reference");
  });

  it.each([
    ["invalid-profile", "profile", "test"],
    [
      "invalid-platform",
      "platform",
      {
        containerArchitecture: "other",
        externalCapabilities: [],
        operatingSystem: "linux",
      },
    ],
    [
      "invalid-platform",
      "platform",
      {
        containerArchitecture: "amd64",
        externalCapabilities: ["not-namespaced"],
        operatingSystem: "linux",
      },
    ],
    [
      "invalid-platform",
      "platform",
      {
        containerArchitecture: "amd64",
        externalCapabilities: ["x/".concat("y".repeat(100))],
        operatingSystem: "linux",
      },
    ],
    [
      "invalid-platform",
      "platform",
      {
        containerArchitecture: "amd64",
        externalCapabilities: [],
        operatingSystem: "other",
      },
    ],
    [
      "duplicate-external-capability",
      "platform",
      {
        containerArchitecture: "amd64",
        externalCapabilities: ["network/tls", "network/tls"],
        operatingSystem: "linux",
      },
    ],
    ["invalid-runtime", "runtime", { major: 0, minor: 0, patch: 0, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24, minor: -1, patch: 0, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24, minor: 0, patch: -1, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24.5, minor: 0, patch: 0, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24, minor: 0.5, patch: 0, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24, minor: 0, patch: 0.5, runtime: "node" }],
    ["invalid-runtime", "runtime", { major: 24, minor: 0, patch: 0, runtime: "other" }],
  ])("rejects %s input", (code, property, value) => {
    const input = validInput();
    replace(input, property, value);

    expect(() => OperatorAdapterSelection.create(input)).toThrowError(
      expect.objectContaining({ code }),
    );
  });
});

function capture(action: () => unknown): OperatorAdapterSelectionError {
  try {
    action();
  } catch (error: unknown) {
    if (error instanceof OperatorAdapterSelectionError) return error;
  }
  throw new Error("Expected operator adapter selection to fail.");
}
