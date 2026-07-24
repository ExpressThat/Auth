import { readFile } from "node:fs/promises";
import type { GenerationPlan } from "./generator-model.js";
import { parseGeneratorRequest } from "./generator-model.js";
import { applyGenerationPlan } from "./plan-writer.js";
import { createRoutePlan } from "./route-plan.js";
import { createWorkspacePlan } from "./workspace-plan.js";

type TextWriter = {
  write(message: string): unknown;
};

export type GeneratorCommandDependencies = {
  apply(root: string, plan: GenerationPlan): Promise<void>;
  read(path: string): Promise<string>;
  stderr: TextWriter;
  stdout: TextWriter;
};

export function defaultGeneratorCommandDependencies(): GeneratorCommandDependencies {
  return {
    apply: applyGenerationPlan,
    read: (path) => readFile(path, "utf8"),
    stderr: process.stderr,
    stdout: process.stdout,
  };
}

export async function runGeneratorCommand(
  root: string,
  arguments_: ReadonlyArray<string>,
  dependencies: GeneratorCommandDependencies,
): Promise<number> {
  try {
    const request = parseGeneratorRequest(arguments_);
    let plan: GenerationPlan;
    if (request.command === "workspace") {
      plan = createWorkspacePlan(request.kind, request.name, request.description);
    } else {
      const manifestPath = `${root}/apps/${request.app}/package.json`;
      const manifestSource = await dependencies.read(manifestPath);
      plan = createRoutePlan(request.app, request.name, manifestSource);
    }

    await dependencies.apply(root, plan);
    dependencies.stdout.write(`${plan.summary}\n`);
    return 0;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown generator failure.";
    dependencies.stderr.write(`${message}\n`);
    return 1;
  }
}
