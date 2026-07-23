import { spawnSync } from "node:child_process";
import { rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));
const BIOME_ENTRY = join(REPOSITORY_ROOT, "node_modules", "@biomejs", "biome", "bin", "biome");
let fixtureSequence = 0;

type LintResult = {
  output: string;
  status: number | null;
};

async function lintSource(source: string, boundary = false): Promise<LintResult> {
  fixtureSequence += 1;
  const directory = boundary ? "apps/auth-api/src" : "tooling/quality";
  const relativePath = `${directory}/biome-policy-fixture-${process.pid}-${fixtureSequence}.ts`;
  const absolutePath = join(REPOSITORY_ROOT, relativePath);

  await writeFile(absolutePath, source, { encoding: "utf8", flag: "wx" });

  try {
    const result = spawnSync(process.execPath, [BIOME_ENTRY, "lint", relativePath], {
      cwd: REPOSITORY_ROOT,
      encoding: "utf8",
    });

    return {
      output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
      status: result.status,
    };
  } finally {
    await rm(absolutePath, { force: true });
  }
}

describe("root Biome policy", () => {
  it.each([
    ["explicit any", "const value: any = 1; export { value };", "noExplicitAny"],
    [
      "floating promise",
      "const run = async (): Promise<void> => {}; run(); export { run };",
      "noFloatingPromises",
    ],
    ["raw environment access", "export const value = process.env.VALUE;", "noProcessEnv"],
    ["console logging", 'console.info("unsafe"); export {};', "noConsole"],
    ["focused test", 'test.only("focused", () => {});', "noFocusedTests"],
    // biome-ignore lint/security/noSecrets: Intentional fake credential used to prove the policy.
    ["embedded secret", 'export const value = "AKIA1234567890EXAMPLE";', "noSecrets"],
    [
      "unsafe assertion",
      'const value = "unsafe" as string; export { value };',
      "Type assertions require runtime proof",
    ],
  ])("rejects %s", async (_name, source, expectedDiagnostic) => {
    const result = await lintSource(source);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain(expectedDiagnostic);
  });

  it("rejects raw JSON decoding in production source", async () => {
    const result = await lintSource('export const value = JSON.parse("{}");', true);

    expect(result.status).not.toBe(0);
    expect(result.output).toContain("Decode JSON through a runtime schema");
  });

  it("accepts narrowed unknown data and handled promises", async () => {
    const source = [
      'const value: unknown = "safe";',
      "const task = Promise.resolve();",
      "await task;",
      "export { value };",
    ].join("\n");
    const result = await lintSource(source);

    expect(result.status).toBe(0);
    expect(result.output).not.toContain("error");
  });
});
