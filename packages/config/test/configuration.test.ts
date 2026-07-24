import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  defineConfiguration,
  parseStartupConfiguration,
  StartupConfigurationError,
} from "../src/index.js";

const clockBinding = {
  marker: "binding-implementation-must-not-serialize",
  now: () => 42,
};

const definition = defineConfiguration({
  bindings: z.strictObject({
    clock: z.object({
      marker: z.string(),
      now: z.function(),
    }),
  }),
  build: z.strictObject({
    release: z.string().regex(/^v\d+\.\d+\.\d+$/u),
  }),
  public: z.strictObject({
    externalOrigin: z.url(),
    serviceName: z.string().min(1),
  }),
  secrets: z.strictObject({
    signingKey: z.string().min(20),
  }),
});

function validInput(): Readonly<Record<string, unknown>> {
  return {
    bindings: { clock: clockBinding },
    build: { release: "v0.1.0" },
    public: {
      externalOrigin: "https://auth.example.test",
      serviceName: "authentication-api",
    },
    secrets: { signingKey: "synthetic-signing-material" },
  };
}

function captureError(action: () => unknown): StartupConfigurationError {
  try {
    action();
  } catch (error: unknown) {
    if (error instanceof StartupConfigurationError) return error;
  }
  throw new Error("Expected startup configuration parsing to fail.");
}

describe("startup configuration", () => {
  it("parses four separately typed configuration areas", () => {
    const configuration = parseStartupConfiguration(definition, validInput());

    expect(configuration.publicValues.externalOrigin).toBe("https://auth.example.test");
    expect(configuration.buildValues.release).toBe("v0.1.0");
    expect(configuration.secret("signingKey")).toBe("synthetic-signing-material");
    expect(configuration.binding("clock").now()).toBe(42);
    expect(Object.isFrozen(configuration.publicValues)).toBe(true);
    expect(Object.isFrozen(configuration.buildValues)).toBe(true);
  });

  it("serializes only safe values and configured key names", () => {
    const serialized = JSON.stringify(parseStartupConfiguration(definition, validInput()));

    expect(serialized).toContain('"signingKey"');
    expect(serialized).toContain('"clock"');
    expect(serialized).toContain("authentication-api");
    expect(serialized).not.toContain("synthetic-signing-material");
    expect(serialized).not.toContain("binding-implementation-must-not-serialize");
  });

  it.each([
    ["envelope", null],
    ["envelope", { ...validInput(), unexpected: true }],
    ["public", { ...validInput(), public: { externalOrigin: "not a URL", serviceName: "" } }],
    ["secrets", { ...validInput(), secrets: { signingKey: "short" } }],
    ["build", { ...validInput(), build: { release: "latest" } }],
    ["bindings", { ...validInput(), bindings: { clock: { marker: "missing method" } } }],
  ])("fails closed for invalid %s configuration", (area, input) => {
    const error = captureError(() => parseStartupConfiguration(definition, input));

    expect(error.code).toBe("STARTUP_CONFIGURATION_INVALID");
    expect(error.message).toBe("Startup configuration is invalid.");
    expect(error.issues[0]?.area).toBe(area);
  });

  it("does not echo an invalid secret through errors or JSON", () => {
    const sensitiveInput = "must-never-appear-in-an-error";
    const error = captureError(() =>
      parseStartupConfiguration(definition, {
        ...validInput(),
        secrets: { signingKey: sensitiveInput.slice(0, 5) },
      }),
    );
    const serialized = JSON.stringify(error);

    expect(serialized).toContain("STARTUP_CONFIGURATION_INVALID");
    expect(serialized).not.toContain(sensitiveInput);
    expect(serialized).not.toContain(sensitiveInput.slice(0, 5));
    expect(error.name).toBe("StartupConfigurationError");
  });

  it("normalizes and sorts hostile schema issue paths", () => {
    const symbolPath = Symbol("hostile");
    const hostileDefinition = defineConfiguration({
      ...definition,
      public: z.record(z.string(), z.unknown()).superRefine((_value, context) => {
        context.addIssue({ code: "custom", message: "second", path: ["z"] });
        context.addIssue({ code: "custom", message: "first", path: [symbolPath] });
        context.addIssue({ code: "custom", message: "same one", path: ["same"] });
        context.addIssue({ code: "custom", message: "same two", path: ["same"] });
      }),
    });
    const error = captureError(() => parseStartupConfiguration(hostileDefinition, validInput()));

    expect(error.issues.map((issue) => issue.path)).toEqual([
      ["[symbol]"],
      ["same"],
      ["same"],
      ["z"],
    ]);
  });

  it("freezes definitions against startup-time replacement", () => {
    expect(Object.isFrozen(definition)).toBe(true);
  });
});
