import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const WORKFLOW = new URL("../../../.github/workflows/full-clean-ci.yml", import.meta.url);

async function readWorkflow(): Promise<string> {
  return readFile(WORKFLOW, "utf8");
}

describe("full clean-checkout CI workflow", () => {
  it("runs from a clean, locked, read-only checkout", async () => {
    const workflow = await readWorkflow();

    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("clean: true");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
  });

  it("runs every generation and validation family", async () => {
    const workflow = await readWorkflow();

    for (const command of [
      "pnpm generate",
      "pnpm generate:contracts",
      "pnpm generate:sdk",
      "pnpm db:generate",
      "pnpm format:check",
      "pnpm check",
      "pnpm check:runtime-neutrality",
      "pnpm check:contracts",
      "pnpm db:check",
      "pnpm check:deployment",
      "pnpm lint",
      "pnpm typecheck",
      "pnpm test:types",
    ]) {
      expect(workflow, command).toContain(command);
    }
  });

  it("runs all tests, builds, and deployment packaging", async () => {
    const workflow = await readWorkflow();

    for (const command of [
      "pnpm test:coverage",
      "playwright install --with-deps chromium firefox webkit",
      "pnpm test:e2e",
      "pnpm test:deployment",
      "pnpm build",
      "pnpm package:deployment",
    ]) {
      expect(workflow, command).toContain(command);
    }
    expect(workflow).not.toContain("\n          pnpm test\n");
  });

  it("rejects tracked drift and undeclared local files", async () => {
    const workflow = await readWorkflow();

    expect(workflow).toContain("git diff --exit-code");
    expect(workflow).toContain("git status --porcelain --untracked-files=all");
    expect(workflow).toContain('if [[ -n "$undeclared_files" ]]');
  });
});
