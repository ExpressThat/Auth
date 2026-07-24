import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const WORKFLOW = new URL("../../../.github/workflows/affected-ci.yml", import.meta.url);

describe("affected CI workflow", () => {
  it("uses complete history and explicit comparison commits", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");

    expect(workflow).toContain("fetch-depth: 0");
    expect(workflow).toContain("TURBO_SCM_BASE=");
    expect(workflow).toContain("TURBO_SCM_HEAD=");
  });

  it("runs the safe affected graph after repository policy", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");

    expect(workflow).toContain("pnpm format:check && pnpm check && pnpm check:runtime-neutrality");
    expect(workflow).toContain("turbo run lint typecheck test:types build --affected");
    expect(workflow).toContain("turbo run test:coverage --affected");
    expect(workflow.indexOf("turbo run lint")).toBeLessThan(
      workflow.indexOf("turbo run test:coverage"),
    );
  });

  it("is read-only, commit-driven, locked, and cancellation-aware", async () => {
    const workflow = await readFile(WORKFLOW, "utf8");

    expect(workflow).toContain("contents: read");
    expect(workflow).toContain("push:");
    expect(workflow).not.toContain("pull_request:");
    expect(workflow).toContain("persist-credentials: false");
    expect(workflow).toContain("pnpm install --frozen-lockfile");
    expect(workflow).toContain("cancel-in-progress: true");
  });
});
