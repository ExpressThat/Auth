import { findAdapterPackagingViolations } from "./adapter-packaging.js";
import type { BoundaryViolation } from "./boundary-model.js";
import type { RepositoryFile } from "./line-checker.js";
import { findSourceViolations } from "./source-boundaries.js";
import { findManifestViolations } from "./workspace-graph.js";
import { readWorkspaces } from "./workspace-reader.js";

export async function findBoundaryViolations(
  files: RepositoryFile[],
): Promise<BoundaryViolation[]> {
  const workspaces = readWorkspaces(files);
  const sourceViolations = await findSourceViolations(workspaces, files);
  return [
    ...findAdapterPackagingViolations(workspaces),
    ...findManifestViolations(workspaces),
    ...sourceViolations,
  ].sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
}
