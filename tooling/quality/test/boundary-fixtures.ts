import { Buffer } from "node:buffer";
import type {
  DependencySection,
  Workspace,
  WorkspaceDependency,
  WorkspaceKind,
} from "../src/boundary-model.js";
import type { RepositoryFile } from "../src/line-checker.js";

export function dependency(
  name: string,
  section: DependencySection = "dependencies",
): WorkspaceDependency {
  return { name, section };
}

export function file(path: string, source: string): RepositoryFile {
  return { content: Buffer.from(source), path };
}

export function workspace(
  name: string,
  kind: WorkspaceKind = "runtime-neutral",
  dependencies: WorkspaceDependency[] = [],
  exports: string[] = ["."],
): Workspace {
  return {
    dependencies,
    exports: new Set(exports),
    kind,
    name,
    path: `packages/${name.replace("@expressthat-auth/", "")}`,
  };
}
