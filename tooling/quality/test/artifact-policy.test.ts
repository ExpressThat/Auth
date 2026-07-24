import { Buffer } from "node:buffer";
import { describe, expect, it } from "vitest";
import { findArtifactViolations } from "../src/artifact-policy.js";
import type { RepositoryFile } from "../src/line-checker.js";

function file(path: string, content: string | number[] = "generated text"): RepositoryFile {
  return {
    content: typeof content === "string" ? Buffer.from(content) : Buffer.from(content),
    path,
  };
}

describe("generated artifact policy", () => {
  it("accepts ordinary source and text generation output", () => {
    expect(
      findArtifactViolations([
        file(""),
        file("src/index.ts"),
        file("src/generated/client.ts"),
        file("openapi/public.json"),
        file("migrations/0001.sql"),
        file("src/model.generated.ts"),
      ]),
    ).toEqual([]);
  });

  it("ignores suspicious extensions outside generated source", () => {
    expect(findArtifactViolations([file("test/fixtures/archive.zip")])).toEqual([]);
  });

  it.each([
    ["generated/archive.zip", "generated source uses suspicious .zip artifact"],
    ["src/generated/.env", "generated path contains a secret-bearing file"],
    ["src/generated/.env.local", "generated path contains a secret-bearing file"],
    ["src/generated/id_rsa", "generated path contains a secret-bearing file"],
    ["src\\generated\\private-key.json", "generated path contains a secret-bearing file"],
  ])("rejects %s", (path, reason) => {
    expect(findArtifactViolations([file(path)])).toEqual([{ path, reason }]);
  });

  it("reports binary and extension findings independently in stable order", () => {
    expect(
      findArtifactViolations([
        file("generated/z.wasm", [1, 0, 2]),
        file("generated/a.ts", [1, 0, 2]),
      ]),
    ).toEqual([
      { path: "generated/a.ts", reason: "generated source contains binary data" },
      { path: "generated/z.wasm", reason: "generated source contains binary data" },
      { path: "generated/z.wasm", reason: "generated source uses suspicious .wasm artifact" },
    ]);
  });
});
