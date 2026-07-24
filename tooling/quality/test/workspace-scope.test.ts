import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const CANONICAL_SCOPE = "@expressthat-auth/";
const RETIRED_SCOPE = ["@express", "that-auth"].join("-");
const RETIRED_RUNTIME_PATTERNS = [
  ["Cloud", "flare"].join(""),
  ["wrang", "ler"].join(""),
  ["worker", "-configuration.d.ts"].join(""),
  ["Hono", " Worker"].join(""),
  ["Worker", " binding"].join(""),
  ["src/", "worker.ts"].join(""),
  ["test/", "worker.test.ts"].join(""),
];

function runGit(arguments_: string[]): { output: string; status: number | null } {
  const result = spawnSync("git", arguments_, {
    cwd: REPOSITORY_ROOT,
    encoding: "utf8",
  });

  return {
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
    status: result.status,
  };
}

describe("workspace package scope", () => {
  it("uses the canonical scope for every workspace manifest", async () => {
    const result = runGit([
      "ls-files",
      "--cached",
      "--others",
      "--exclude-standard",
      "--",
      "*package.json",
    ]);

    expect(result.status).toBe(0);
    const manifests = result.output
      .split(/\r?\n/u)
      .filter(
        (path) =>
          path.length > 0 &&
          path !== "package.json" &&
          existsSync(new URL(`../../../${path}`, import.meta.url)),
      );

    expect(manifests.length).toBeGreaterThan(0);

    for (const manifest of manifests) {
      const source = await readFile(new URL(`../../../${manifest}`, import.meta.url), "utf8");
      const packageName = /"name"\s*:\s*"([^"]+)"/u.exec(source)?.[1];

      expect(packageName?.startsWith(CANONICAL_SCOPE), manifest).toBe(true);
    }
  });

  it("does not retain the retired scope in tracked files", () => {
    const result = runGit(["grep", "-n", RETIRED_SCOPE, "--", "."]);

    expect(result.status).toBe(1);
    expect(result.output).toBe("");
  });

  it("does not retain retired edge-runtime implementation references", () => {
    for (const pattern of RETIRED_RUNTIME_PATTERNS) {
      const result = runGit(["grep", "-n", pattern, "--", "."]);

      expect(result.status, pattern).toBe(1);
      expect(result.output, pattern).toBe("");
    }
  });
});
