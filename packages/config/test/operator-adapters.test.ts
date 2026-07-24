import {
  OperatorAdapterSelection,
  OperatorAdapterSelectionError,
} from "@expressthat-auth/runtime/operator";
import { describe, expect, it } from "vitest";
import { StartupConfigurationError } from "../src/index.js";
import { parseOperatorAdapterConfiguration } from "../src/operator.js";

function validInput(): Readonly<Record<string, unknown>> {
  return {
    bindings: [
      {
        adapter: "reference/durable-state",
        capability: "infrastructure/durable-queue",
      },
    ],
    platform: {
      containerArchitecture: "amd64",
      externalCapabilities: ["network/tls"],
      operatingSystem: "linux",
    },
    profile: "self-hosted",
    runtime: { major: 24, minor: 18, patch: 0, runtime: "node" },
  };
}

describe("operator adapter configuration", () => {
  it.each(["hosted", "local-development", "self-hosted"])(
    "parses a strict %s startup-only selection",
    (profile) => {
      const selection = parseOperatorAdapterConfiguration({
        ...validInput(),
        profile,
      });

      expect(selection).toBeInstanceOf(OperatorAdapterSelection);
      expect(selection.profile).toBe(profile);
      expect(selection.bindings()[0]?.adapter.toString()).toBe("reference/durable-state");
    },
  );

  it.each([
    null,
    {},
    { ...validInput(), unexpected: true },
    { ...validInput(), bindings: [] },
    {
      ...validInput(),
      bindings: [{ adapter: "not-namespaced", capability: "also-invalid" }],
    },
    { ...validInput(), profile: "test" },
    {
      ...validInput(),
      platform: {
        containerArchitecture: "other",
        externalCapabilities: ["invalid"],
        operatingSystem: "other",
      },
    },
    {
      ...validInput(),
      runtime: { major: 0, minor: -1, patch: -1, runtime: "other" },
    },
  ])("fails closed for malformed operator input", (input) => {
    expect(() => parseOperatorAdapterConfiguration(input)).toThrow(StartupConfigurationError);
  });

  it("rejects duplicate capabilities after schema validation", () => {
    const binding = {
      adapter: "reference/durable-state",
      capability: "infrastructure/durable-queue",
    };

    expect(() =>
      parseOperatorAdapterConfiguration({
        ...validInput(),
        bindings: [binding, { ...binding, adapter: "reference/duplicate" }],
      }),
    ).toThrow(OperatorAdapterSelectionError);
  });

  it("does not expose operator values through serialization or errors", () => {
    const selection = parseOperatorAdapterConfiguration(validInput());

    expect(JSON.stringify(selection)).not.toContain("reference/durable-state");
    try {
      parseOperatorAdapterConfiguration({
        ...validInput(),
        bindings: [{ adapter: "private/value", capability: "SENSITIVE-VALUE" }],
      });
    } catch (error: unknown) {
      expect(JSON.stringify(error)).not.toContain("private/value");
      expect(JSON.stringify(error)).not.toContain("SENSITIVE-VALUE");
    }
  });
});
