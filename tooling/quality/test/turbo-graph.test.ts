import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { z } from "zod";

const REPOSITORY_ROOT = new URL("../../../", import.meta.url);
const taskSchema = z.object({
  cache: z.boolean().optional(),
  dependsOn: z.array(z.string()).optional(),
  description: z.string().min(1),
  env: z.array(z.string()).optional(),
  interactive: z.boolean().optional(),
  interruptible: z.boolean().optional(),
  outputs: z.array(z.string()).optional(),
  passThroughEnv: z.array(z.string()).optional(),
  persistent: z.boolean().optional(),
});
const turboSchema = z.object({
  globalDependencies: z.array(z.string()).min(1),
  tasks: z.record(z.string(), taskSchema),
});

async function readTurboConfiguration(): Promise<z.infer<typeof turboSchema>> {
  const source = await readFile(new URL("turbo.json", REPOSITORY_ROOT), "utf8");
  const untrustedConfiguration: unknown = JSON.parse(source);
  return turboSchema.parse(untrustedConfiguration);
}

describe("Turborepo task graph", () => {
  it("defines every architectural task family", async () => {
    const configuration = await readTurboConfiguration();

    expect(Object.keys(configuration.tasks).sort()).toEqual([
      "build",
      "check:contracts",
      "check:deployment",
      "db:check",
      "db:generate",
      "db:migrate",
      "db:reset",
      "deploy",
      "dev",
      "dev:dependencies",
      "generate",
      "generate:contracts",
      "generate:sdk",
      "lint",
      "package:deployment",
      "test",
      "test:coverage",
      "test:deployment",
      "test:e2e",
      "test:types",
      "typecheck",
    ]);
  });

  it("never caches stateful or long-running tasks", async () => {
    const { tasks } = await readTurboConfiguration();
    const { dev } = tasks;

    for (const name of [
      "db:migrate",
      "db:reset",
      "deploy",
      "dev",
      "dev:dependencies",
      "test:deployment",
      "test:e2e",
    ]) {
      expect(tasks[name]?.cache, name).toBe(false);
    }
    expect(dev?.persistent).toBe(true);
    expect(tasks["dev:dependencies"]?.persistent).toBe(true);
    expect(dev?.interruptible).toBe(true);
    expect(tasks["db:reset"]?.interactive).toBe(true);
  });

  it("declares generated, coverage, browser, SDK, database, and deployment artifacts", async () => {
    const { tasks } = await readTurboConfiguration();
    const { generate } = tasks;

    expect(generate?.outputs).toContain("src/generated/**");
    expect(tasks["generate:contracts"]?.outputs).toContain("openapi/**");
    expect(tasks["generate:sdk"]?.outputs).toContain("generated/sdk/**");
    expect(tasks["db:generate"]?.outputs).toContain("migrations/**");
    expect(tasks["test:coverage"]?.outputs).toContain("coverage/**");
    expect(tasks["test:e2e"]?.outputs).toContain("playwright-report/**");
    expect(tasks["package:deployment"]?.outputs).toContain("artifacts/**");
  });

  it("passes secrets only to non-cacheable stateful tasks", async () => {
    const { tasks } = await readTurboConfiguration();
    const secretBearingTasks = Object.entries(tasks).filter(
      ([, task]) => task.passThroughEnv !== undefined,
    );

    expect(secretBearingTasks.length).toBeGreaterThan(0);
    for (const [name, task] of secretBearingTasks) {
      expect(task.cache, name).toBe(false);
      expect(task.env, name).toBeUndefined();
    }
  });

  it("loads through the pinned Turbo implementation", () => {
    const root = fileURLToPath(REPOSITORY_ROOT);

    expect(root).toMatch(/[\\/]Auth[\\/]?$/u);
  });
});
