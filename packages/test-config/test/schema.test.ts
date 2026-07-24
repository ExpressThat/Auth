import { describe, expect, it } from "vitest";
import { z } from "zod";
import { assertSchemaCases } from "../src/index.js";

const exampleSchema = z.object({
  enabled: z.boolean(),
  name: z.string().min(1),
});

describe("schema case assertions", () => {
  it("accepts valid cases and rejects invalid cases", () => {
    expect(() =>
      assertSchemaCases(exampleSchema, {
        invalid: [
          { enabled: "yes", name: "example" },
          { enabled: true, name: "" },
        ],
        valid: [{ enabled: true, name: "example" }],
      }),
    ).not.toThrow();
  });

  it("identifies the indexed valid case that was rejected", () => {
    expect(() =>
      assertSchemaCases(exampleSchema, {
        invalid: [],
        valid: [
          { enabled: true, name: "valid" },
          { enabled: false, name: "" },
        ],
      }),
    ).toThrow("Schema rejected valid case 1.");
  });

  it("identifies the indexed invalid case that was accepted", () => {
    expect(() =>
      assertSchemaCases(exampleSchema, {
        invalid: [{ enabled: true, name: "accepted" }],
        valid: [],
      }),
    ).toThrow("Schema accepted invalid case 0.");
  });
});
