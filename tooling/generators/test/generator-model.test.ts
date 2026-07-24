import { describe, expect, it } from "vitest";
import { parseGeneratorRequest } from "../src/generator-model.js";

describe("generator request parser", () => {
  it("parses workspace and route requests", () => {
    expect(
      parseGeneratorRequest([
        "workspace",
        "--kind",
        "library",
        "--name",
        "audit-core",
        "--description",
        "Audit domain.",
      ]),
    ).toEqual({
      command: "workspace",
      description: "Audit domain.",
      kind: "library",
      name: "audit-core",
    });
    expect(parseGeneratorRequest(["route", "--app", "auth-api", "--name", "health-check"])).toEqual(
      {
        app: "auth-api",
        command: "route",
        name: "health-check",
      },
    );
  });

  it.each([
    [[], "workspace or route"],
    [["unknown"], "workspace or route"],
    [["route", "--app"], "requires a value"],
    [["route", "app", "auth-api", "--name", "health"], "--name value"],
    [["route", "--", "value", "--name", "health"], "Invalid or duplicate"],
    [["route", "--app", "auth-api", "--app", "other", "--name", "health"], "Invalid or duplicate"],
    [["route", "--app", "Auth API", "--name", "health"], "kebab-case"],
    [["route", "--app", "auth-api", "--name", "health", "--extra", "value"], "unrecognized"],
  ])("rejects invalid arguments %#", (arguments_, message) => {
    expect(() => parseGeneratorRequest(arguments_)).toThrow(message);
  });
});
