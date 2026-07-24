import { builtinModules } from "node:module";
import { parseSync, type Span } from "oxc-parser";
import type { BoundaryViolation, Workspace } from "./boundary-model.js";
import type { RepositoryFile } from "./line-checker.js";

const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/u;
const INTERNAL_SCOPE = "@expressthat-auth/";
const NODE_BUILTINS = new Set(
  builtinModules.flatMap((specifier) => [
    specifier,
    specifier.startsWith("node:") ? specifier.slice(5) : `node:${specifier}`,
  ]),
);
const RUNTIME_PROTOCOL = /^(?:bun|cloudflare|deno):/u;
const OPERATOR_EXPORTS = new Set([
  "@expressthat-auth/config/operator",
  "@expressthat-auth/runtime/operator",
]);

export async function findSourceViolations(
  workspaces: Workspace[],
  files: RepositoryFile[],
): Promise<BoundaryViolation[]> {
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const byLongestPath = [...workspaces].sort((left, right) => right.path.length - left.path.length);
  const violations: BoundaryViolation[] = [];

  for (const file of files) {
    const normalizedPath = file.path.replaceAll("\\", "/");
    if (!SOURCE_EXTENSION.test(normalizedPath)) {
      continue;
    }

    const importer = byLongestPath.find((workspace) =>
      normalizedPath.startsWith(`${workspace.path}/`),
    );
    if (importer === undefined) {
      continue;
    }

    const source = file.content.toString("utf8");
    for (const specifier of readModuleSpecifiers(normalizedPath, source)) {
      inspectRuntimeNeutralImport(importer, specifier, normalizedPath, violations);
      if (!specifier.startsWith(INTERNAL_SCOPE)) {
        continue;
      }
      inspectInternalImport(importer, specifier, normalizedPath, byName, violations);
    }
  }

  inspectRuntimeNeutralBuilds(workspaces, files, violations);
  return violations.sort(
    (left, right) =>
      left.path.localeCompare(right.path) || left.message.localeCompare(right.message),
  );
}

function inspectRuntimeNeutralImport(
  importer: Workspace,
  specifier: string,
  sourcePath: string,
  violations: BoundaryViolation[],
): void {
  if (
    importer.kind === "runtime-neutral" &&
    sourcePath.startsWith(`${importer.path}/src/`) &&
    (NODE_BUILTINS.has(specifier) || RUNTIME_PROTOCOL.test(specifier))
  ) {
    violations.push({
      code: "deployment-import",
      message: `${specifier} is unavailable to runtime-neutral production source.`,
      path: sourcePath,
    });
  }
}

function inspectRuntimeNeutralBuilds(
  workspaces: Workspace[],
  files: RepositoryFile[],
  violations: BoundaryViolation[],
): void {
  for (const workspace of workspaces) {
    if (workspace.kind !== "runtime-neutral" && workspace.scripts.has("build:runtime-neutral")) {
      violations.push({
        code: "unexpected-neutral-build",
        message: `${workspace.name} is not runtime-neutral but declares the neutral build task.`,
        path: `${workspace.path}/package.json`,
      });
      continue;
    }
    if (
      workspace.kind === "runtime-neutral" &&
      !workspace.scripts.has("build:runtime-neutral") &&
      files.some((file) => file.path.replaceAll("\\", "/").startsWith(`${workspace.path}/src/`))
    ) {
      violations.push({
        code: "missing-neutral-build",
        message: `${workspace.name} has source but no independent runtime-neutral build task.`,
        path: `${workspace.path}/package.json`,
      });
    }
  }
}

function readModuleSpecifiers(path: string, source: string): string[] {
  const result = parseSync(path, source);
  const firstError = result.errors[0];
  if (firstError !== undefined) {
    throw new Error(`Cannot inspect imports in ${path}: ${firstError.message}`);
  }

  const staticImports = result.module.staticImports.map((item) => item.moduleRequest.value);
  const staticExports = result.module.staticExports.flatMap((item) =>
    item.entries.flatMap((entry) =>
      entry.moduleRequest === null ? [] : [entry.moduleRequest.value],
    ),
  );
  const dynamicImports = result.module.dynamicImports.flatMap((item) => {
    const value = readStringLiteral(source, item.moduleRequest);
    return value === undefined ? [] : [value];
  });
  return [...staticImports, ...staticExports, ...dynamicImports];
}

function readStringLiteral(source: string, span: Span): string | undefined {
  const raw = source.slice(span.start, span.end);
  const quote = raw.at(0);
  if ((quote !== '"' && quote !== "'") || raw.at(-1) !== quote || raw.includes("\\")) {
    return undefined;
  }
  return raw.slice(1, -1);
}

function inspectInternalImport(
  importer: Workspace,
  specifier: string,
  sourcePath: string,
  byName: Map<string, Workspace>,
  violations: BoundaryViolation[],
): void {
  const parts = specifier.split("/");
  const targetName = parts.slice(0, 2).join("/");
  const target = byName.get(targetName);

  if (target === undefined) {
    violations.push({
      code: "unknown-import",
      message: `${specifier} does not resolve to a workspace.`,
      path: sourcePath,
    });
    return;
  }

  if (
    OPERATOR_EXPORTS.has(specifier) &&
    importer.kind !== "deployment" &&
    importer.name !== target.name &&
    importer.name !== "@expressthat-auth/config"
  ) {
    violations.push({
      code: "operator-control-import",
      message: `${specifier} is restricted to operator configuration and deployment composition.`,
      path: sourcePath,
    });
  }

  if (
    importer.name !== target.name &&
    !importer.dependencies.some((dependency) => dependency.name === target.name)
  ) {
    violations.push({
      code: "undeclared-import",
      message: `${target.name} is imported without a manifest dependency.`,
      path: sourcePath,
    });
  }

  const exportKey = parts.length === 2 ? "." : `./${parts.slice(2).join("/")}`;
  if (!isExported(target.exports, exportKey)) {
    violations.push({
      code: exportKey === "." ? "missing-public-export" : "deep-import",
      message: `${specifier} is not exposed by ${target.name}.`,
      path: sourcePath,
    });
  }
}

function isExported(exports: Set<string>, requested: string): boolean {
  if (exports.has(requested)) {
    return true;
  }

  for (const exportKey of exports) {
    if (exportKey.endsWith("/*") && requested.startsWith(exportKey.slice(0, -1))) {
      return true;
    }
  }
  return false;
}
