import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve, sep } from "node:path";
import type { GenerationPlan } from "./generator-model.js";

export type PlanWriterDependencies = {
  exists(path: string): Promise<boolean>;
  write(path: string, content: string): Promise<void>;
};

export async function pathExists(
  path: string,
  check: (path: string) => Promise<void> = access,
): Promise<boolean> {
  try {
    await check(path);
    return true;
  } catch (error: unknown) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function writeGeneratedFile(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, { encoding: "utf8", flag: "w" });
}

function resolveInsideRoot(root: string, path: string): string {
  const normalizedRoot = resolve(root);
  const destination = resolve(normalizedRoot, path);
  if (!destination.startsWith(`${normalizedRoot}${sep}`)) {
    throw new Error(`Generated path escapes the repository: ${path}.`);
  }
  return destination;
}

export async function applyGenerationPlan(
  root: string,
  plan: GenerationPlan,
  dependencies?: PlanWriterDependencies,
): Promise<void> {
  const selectedDependencies = dependencies ?? {
    exists: pathExists,
    write: writeGeneratedFile,
  };
  const destinations = plan.changes.map((change) => ({
    ...change,
    destination: resolveInsideRoot(root, change.path),
  }));
  if (new Set(destinations.map((change) => change.destination)).size !== destinations.length) {
    throw new Error("Generation plan contains duplicate destination files.");
  }

  const checkedDestinations = [];
  for (const change of destinations) {
    const exists = await selectedDependencies.exists(change.destination);
    if (change.mode === "create" && exists) {
      throw new Error(`Refusing to overwrite existing file: ${change.path}.`);
    }
    if (change.mode === "replace" && !exists) {
      throw new Error(`Cannot update missing file: ${change.path}.`);
    }
    checkedDestinations.push({ ...change, exists });
  }

  for (const change of checkedDestinations) {
    if (change.mode !== "ensure" || !change.exists) {
      await selectedDependencies.write(change.destination, change.content);
    }
  }
}
