import { init, parse } from "es-module-lexer";
import type { BoundaryViolation, Workspace } from "./boundary-model.js";
import type { RepositoryFile } from "./line-checker.js";

const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/u;
const INTERNAL_SCOPE = "@expressthat-auth/";

export async function findSourceViolations(
  workspaces: Workspace[],
  files: RepositoryFile[],
): Promise<BoundaryViolation[]> {
  await init;
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

    const [imports] = parse(file.content.toString("utf8"));
    for (const importedFile of imports) {
      const specifier = importedFile.n;
      if (specifier === undefined) {
        continue;
      }
      if (!specifier.startsWith(INTERNAL_SCOPE)) {
        continue;
      }
      inspectInternalImport(importer, specifier, normalizedPath, byName, violations);
    }
  }

  return violations.sort(
    (left, right) =>
      left.path.localeCompare(right.path) || left.message.localeCompare(right.message),
  );
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
