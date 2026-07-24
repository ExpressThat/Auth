import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GenerationPlan } from "../src/generator-model.js";
import {
  applyGenerationPlan,
  type PlanWriterDependencies,
  pathExists,
  writeGeneratedFile,
} from "../src/plan-writer.js";

const temporaryDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const path = await mkdtemp(join(tmpdir(), "expressthat-auth-generator-"));
  temporaryDirectories.push(path);
  return path;
}

afterEach(async () => {
  for (const path of temporaryDirectories.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

function dependencies(exists: boolean): PlanWriterDependencies {
  return {
    exists: vi.fn(async () => exists),
    write: vi.fn(async () => undefined),
  };
}

describe("generation plan writer", () => {
  it("writes a preflighted plan through injected dependencies", async () => {
    const root = resolve("repository");
    const adapter = dependencies(false);
    const plan: GenerationPlan = {
      changes: [{ content: "source", mode: "create", path: "packages/new/src.ts" }],
      summary: "Created.",
    };

    await expect(applyGenerationPlan(root, plan, adapter)).resolves.toBeUndefined();
    expect(adapter.exists).toHaveBeenCalledWith(resolve(root, "packages/new/src.ts"));
    expect(adapter.write).toHaveBeenCalledWith(resolve(root, "packages/new/src.ts"), "source");
  });

  it("creates a missing ensured file and preserves an existing one", async () => {
    const createAdapter = dependencies(false);
    const preserveAdapter = dependencies(true);
    const plan: GenerationPlan = {
      changes: [{ content: "default", mode: "ensure", path: "config.ts" }],
      summary: "",
    };

    await applyGenerationPlan("repository", plan, createAdapter);
    await applyGenerationPlan("repository", plan, preserveAdapter);

    expect(createAdapter.write).toHaveBeenCalledOnce();
    expect(preserveAdapter.write).not.toHaveBeenCalled();
  });

  it("refuses overwrite, missing replacements, and traversal before writing", async () => {
    const createAdapter = dependencies(true);
    const replaceAdapter = dependencies(false);

    await expect(
      applyGenerationPlan(
        "repository",
        {
          changes: [{ content: "", mode: "create", path: "existing.ts" }],
          summary: "",
        },
        createAdapter,
      ),
    ).rejects.toThrow("Refusing to overwrite");
    await expect(
      applyGenerationPlan(
        "repository",
        {
          changes: [{ content: "", mode: "replace", path: "missing.ts" }],
          summary: "",
        },
        replaceAdapter,
      ),
    ).rejects.toThrow("Cannot update missing");
    await expect(
      applyGenerationPlan(
        "repository",
        {
          changes: [{ content: "", mode: "create", path: "../escape.ts" }],
          summary: "",
        },
        dependencies(false),
      ),
    ).rejects.toThrow("escapes the repository");
    await expect(
      applyGenerationPlan(
        "repository",
        {
          changes: [
            { content: "first", mode: "create", path: "duplicate.ts" },
            { content: "second", mode: "create", path: "duplicate.ts" },
          ],
          summary: "",
        },
        dependencies(false),
      ),
    ).rejects.toThrow("duplicate destination");
    expect(createAdapter.write).not.toHaveBeenCalled();
    expect(replaceAdapter.write).not.toHaveBeenCalled();
  });

  it("uses the real filesystem dependencies without overwriting", async () => {
    const root = await temporaryDirectory();
    const plan: GenerationPlan = {
      changes: [{ content: "created", mode: "create", path: "nested/example.txt" }],
      summary: "Created.",
    };

    await applyGenerationPlan(root, plan);

    await expect(readFile(join(root, "nested/example.txt"), "utf8")).resolves.toBe("created");
    await expect(applyGenerationPlan(root, plan)).rejects.toThrow("Refusing to overwrite");
  });

  it("reports filesystem existence and unexpected access failures", async () => {
    const root = await temporaryDirectory();
    const file = join(root, "file");
    await writeFile(file, "content", "utf8");

    await expect(pathExists(file)).resolves.toBe(true);
    await expect(pathExists(join(root, "missing"))).resolves.toBe(false);
    await expect(
      pathExists("unreadable", async () => Promise.reject(new Error("access denied"))),
    ).rejects.toThrow("access denied");
  });

  it("creates parent directories for a generated file", async () => {
    const root = await temporaryDirectory();
    const destination = join(root, "deep", "file.txt");

    await writeGeneratedFile(destination, "generated");

    await expect(readFile(destination, "utf8")).resolves.toBe("generated");
  });
});
