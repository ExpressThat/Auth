import { describe, expect, it } from "vitest";
import {
  CapabilityValidationError,
  RuntimeCapability,
  validateCapabilityComposition,
} from "../src/index.js";
import {
  cacheCapability,
  composition,
  manifest,
  queueCapability,
  requirement,
} from "./capability-test-fixture.js";

describe("runtime capability composition validation", () => {
  it("proves a complete compatible startup composition", () => {
    const selected = manifest();
    const result = validateCapabilityComposition(
      composition({
        bindings: [{ capability: queueCapability, manifest: selected }],
      }),
    );

    expect(result.manifestFor(queueCapability)).toBe(selected);
    expect(result.manifestFor(cacheCapability)).toBeUndefined();
    expect(result.toJSON()).toEqual({ redacted: true });
    expect(Object.isFrozen(result)).toBe(true);
  });

  it("permits operator residency and non-durable requirements", () => {
    const selected = manifest({
      coordination: "process",
      durability: "ephemeral",
      profiles: ["local-development"],
      residency: "operator-defined",
    });

    expect(
      validateCapabilityComposition(
        composition({
          bindings: [{ capability: queueCapability, manifest: selected }],
          profile: "local-development",
          requirements: [requirement({ residency: "operator-defined", state: "any" })],
        }),
      ).manifestFor(queueCapability),
    ).toBe(selected);
  });

  it.each([
    ["missing-capability", composition({ bindings: [] })],
    ["duplicate-requirement", composition({ requirements: [requirement(), requirement()] })],
    [
      "duplicate-binding",
      composition({
        bindings: [
          { capability: queueCapability, manifest: manifest() },
          { capability: queueCapability, manifest: manifest() },
        ],
      }),
    ],
    [
      "unexpected-binding",
      composition({
        bindings: [
          { capability: queueCapability, manifest: manifest() },
          { capability: cacheCapability, manifest: manifest({ capability: cacheCapability }) },
        ],
      }),
    ],
    [
      "undeclared-capability",
      composition({
        bindings: [
          { capability: queueCapability, manifest: manifest({ capability: cacheCapability }) },
        ],
      }),
    ],
    [
      "profile-incompatible",
      composition({
        bindings: [
          {
            capability: queueCapability,
            manifest: manifest({ profiles: ["local-development"] }),
          },
        ],
      }),
    ],
    [
      "runtime-incompatible",
      composition({ runtime: { major: 27, minor: 0, patch: 0, runtime: "node" } }),
    ],
    [
      "runtime-incompatible",
      composition({ runtime: { major: 23, minor: 9, patch: 0, runtime: "node" } }),
    ],
    [
      "state-incompatible",
      composition({
        bindings: [
          {
            capability: queueCapability,
            manifest: manifest({ coordination: "process", durability: "ephemeral" }),
          },
        ],
      }),
    ],
    [
      "residency-incompatible",
      composition({
        bindings: [
          {
            capability: queueCapability,
            manifest: manifest({ residency: "operator-defined" }),
          },
        ],
      }),
    ],
  ])("rejects incompatible composition with %s", (code, input) => {
    expect(() => validateCapabilityComposition(input)).toThrow(expect.objectContaining({ code }));
  });

  it("rejects invalid runtime version fields", () => {
    for (const runtime of [
      { major: 0, minor: 0, patch: 0, runtime: "node" as const },
      { major: 24, minor: -1, patch: 0, runtime: "node" as const },
      { major: 24, minor: 1, patch: -1, runtime: "node" as const },
      { major: 24.5, minor: 1, patch: 1, runtime: "node" as const },
    ]) {
      expect(() => validateCapabilityComposition(composition({ runtime }))).toThrow(TypeError);
    }
  });

  it("returns normalized non-sensitive validation errors", () => {
    const capability = RuntimeCapability.parse("infrastructure/object-storage");
    const error = new CapabilityValidationError("missing-capability", capability);

    expect(error.name).toBe("CapabilityValidationError");
    expect(error.message).toBe("Runtime capability validation failed (missing-capability).");
    expect(error.capability).toBe(capability);
    expect(error.toJSON()).toEqual({
      capability: "infrastructure/object-storage",
      code: "missing-capability",
    });
  });
});
