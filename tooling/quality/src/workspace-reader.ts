import { z } from "zod";
import type { DependencySection, Workspace, WorkspaceDependency } from "./boundary-model.js";
import { classifyWorkspace } from "./boundary-policy.js";
import type { RepositoryFile } from "./line-checker.js";

const dependencySchema = z.record(z.string(), z.string()).optional();
const scriptSchema = z.record(z.string(), z.string()).optional();
const identifierSchema = z
  .string()
  .regex(/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*(?:\/[a-z][a-z0-9]*(?:[.-][a-z0-9]+)*)+$/u)
  .max(96);
const infrastructureAdapterSchema = z
  .object({
    category: z.enum([
      "cache",
      "certificate",
      "deployment",
      "dns",
      "key-management",
      "object-storage",
      "observability",
      "queue",
      "secret",
    ]),
    runtimeSupport: z.object({
      containerArchitectures: z.array(z.enum(["amd64", "arm64"])).min(1),
      externalCapabilities: z.array(identifierSchema),
      node: z.object({
        maximumMajorExclusive: z.number().int().positive(),
        minimumMajor: z.number().int().positive(),
      }),
      operatingSystems: z.array(z.enum(["darwin", "linux", "win32"])).min(1),
    }),
  })
  .strict();
const manifestSchema = z.object({
  dependencies: dependencySchema,
  devDependencies: dependencySchema,
  expressthatAuth: z
    .object({ infrastructureAdapter: infrastructureAdapterSchema })
    .strict()
    .optional(),
  exports: z.unknown().optional(),
  name: z.string().min(1),
  optionalDependencies: dependencySchema,
  peerDependencies: dependencySchema,
  scripts: scriptSchema,
});
const DEPENDENCY_SECTIONS: DependencySection[] = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

export function readWorkspaces(files: RepositoryFile[]): Workspace[] {
  return files
    .filter((file) => isWorkspaceManifest(file.path))
    .map((file) => decodeWorkspace(file))
    .sort((left, right) => left.name.localeCompare(right.name));
}

function isWorkspaceManifest(path: string): boolean {
  return /^(apps|deploy|packages|tooling)\/.+\/package\.json$/u.test(path.replaceAll("\\", "/"));
}

function decodeWorkspace(file: RepositoryFile): Workspace {
  const source = file.content.toString("utf8");
  // biome-ignore lint/plugin: The parsed value is immediately validated by the manifest schema.
  const untrustedManifest: unknown = JSON.parse(source);
  const manifest = manifestSchema.parse(untrustedManifest);
  const dependencies: WorkspaceDependency[] = [];

  for (const section of DEPENDENCY_SECTIONS) {
    const selectedDependencies = manifest[section] ?? {};

    for (const name of Object.keys(selectedDependencies)) {
      dependencies.push({ name, section });
    }
  }

  const path = file.path.replaceAll("\\", "/").replace(/\/package\.json$/u, "");
  const infrastructureAdapter = manifest.expressthatAuth?.infrastructureAdapter;
  return {
    dependencies,
    exports: readExports(manifest.exports),
    ...(infrastructureAdapter === undefined ? {} : { infrastructureAdapter }),
    kind: classifyWorkspace(path, manifest.name),
    name: manifest.name,
    path,
    scripts: new Set(Object.keys(manifest.scripts ?? {})),
  };
}

function readExports(value: unknown): Set<string> {
  if (typeof value === "string" || Array.isArray(value)) {
    return new Set(["."]);
  }
  if (value !== null && typeof value === "object") {
    return new Set(Object.keys(value));
  }
  return new Set();
}
