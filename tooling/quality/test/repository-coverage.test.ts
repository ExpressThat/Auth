import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { findCoveragePolicyViolations } from "../src/coverage-policy.js";
import { readRepositoryFiles } from "../src/repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

describe("repository coverage policy", () => {
  it("does not permit executable workspaces to opt out", async () => {
    const files = await readRepositoryFiles(REPOSITORY_ROOT);

    expect(findCoveragePolicyViolations(files)).toEqual([]);
  });
});
