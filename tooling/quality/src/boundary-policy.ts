import type { DependencySection, Workspace, WorkspaceKind } from "./boundary-model.js";

const SHARED_CONFIG_NAMES = new Set([
  "@expressthat-auth/lint-config",
  "@expressthat-auth/test-config",
  "@expressthat-auth/typescript-config",
]);

const IMPLEMENTATION_NAMES = new Set([
  "@expressthat-auth/database-conformance",
  "@expressthat-auth/database-postgres",
  "@expressthat-auth/database-sqlite",
  "@expressthat-auth/ui",
]);

const UI_FORBIDDEN_TARGETS = new Set([
  "@expressthat-auth/data-access",
  "@expressthat-auth/database-postgres",
  "@expressthat-auth/database-sqlite",
  "@expressthat-auth/runtime",
]);

export function classifyWorkspace(path: string, name: string): WorkspaceKind {
  const normalizedPath = path.replaceAll("\\", "/");

  if (normalizedPath.startsWith("apps/")) {
    return "application";
  }
  if (normalizedPath.startsWith("deploy/")) {
    return "deployment";
  }
  if (normalizedPath.startsWith("tooling/")) {
    return "tooling";
  }
  if (SHARED_CONFIG_NAMES.has(name)) {
    return "shared-config";
  }
  if (name === "@expressthat-auth/database-conformance") {
    return "conformance";
  }
  if (IMPLEMENTATION_NAMES.has(name) || normalizedPath.startsWith("packages/providers/")) {
    return "implementation";
  }
  return "runtime-neutral";
}

export function permitsDependency(
  importer: Workspace,
  target: Workspace,
  section: DependencySection,
): boolean {
  if (importer.name === "@expressthat-auth/api-contracts" && isDataPackage(target.name)) {
    return false;
  }
  if (importer.name === "@expressthat-auth/ui" && UI_FORBIDDEN_TARGETS.has(target.name)) {
    return false;
  }
  if (section === "devDependencies" && target.kind === "shared-config") {
    return true;
  }

  const allowedKinds = allowedTargetKinds(importer.kind);
  return allowedKinds.has(target.kind);
}

function isDataPackage(name: string): boolean {
  return name === "@expressthat-auth/data-access" || name.includes("/database-");
}

function allowedTargetKinds(kind: WorkspaceKind): Set<WorkspaceKind> {
  switch (kind) {
    case "application":
      return new Set(["implementation", "runtime-neutral"]);
    case "conformance":
      return new Set(["implementation", "runtime-neutral"]);
    case "deployment":
      return new Set(["application", "implementation", "runtime-neutral"]);
    case "implementation":
      return new Set(["implementation", "runtime-neutral"]);
    case "runtime-neutral":
      return new Set(["runtime-neutral"]);
    case "shared-config":
      return new Set(["shared-config"]);
    case "tooling":
      return new Set(["shared-config"]);
  }
}
