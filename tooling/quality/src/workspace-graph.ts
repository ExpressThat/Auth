import type { BoundaryViolation, Workspace } from "./boundary-model.js";
import { permitsDependency } from "./boundary-policy.js";

export function findManifestViolations(workspaces: Workspace[]): BoundaryViolation[] {
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const violations: BoundaryViolation[] = [];

  for (const workspace of workspaces) {
    for (const dependency of workspace.dependencies) {
      if (!dependency.name.startsWith("@expressthat-auth/")) {
        continue;
      }

      const target = byName.get(dependency.name);
      if (target === undefined) {
        violations.push({
          code: "unknown-workspace",
          message: `${dependency.name} is declared but no matching workspace exists.`,
          path: `${workspace.path}/package.json`,
        });
      } else if (!permitsDependency(workspace, target, dependency.section)) {
        violations.push({
          code: "forbidden-direction",
          message: `${workspace.name} cannot depend on ${target.name} via ${dependency.section}.`,
          path: `${workspace.path}/package.json`,
        });
      }
    }
  }

  return [...violations, ...findCycleViolations(workspaces)].sort(compareViolations);
}

function findCycleViolations(workspaces: Workspace[]): BoundaryViolation[] {
  const byName = new Map(workspaces.map((workspace) => [workspace.name, workspace]));
  const state = new Map<string, "active" | "complete">();
  const reported = new Set<string>();
  const violations: BoundaryViolation[] = [];

  function visit(workspace: Workspace, trail: string[]): void {
    state.set(workspace.name, "active");
    const nextTrail = [...trail, workspace.name];

    for (const dependency of workspace.dependencies) {
      const target = byName.get(dependency.name);
      if (target === undefined) {
        continue;
      }

      if (state.get(target.name) === "active") {
        const cycleStart = nextTrail.indexOf(target.name);
        const cycle = [...nextTrail.slice(cycleStart), target.name];
        const key = [...new Set(cycle)].sort().join("|");

        if (!reported.has(key)) {
          reported.add(key);
          violations.push({
            code: "workspace-cycle",
            message: `Workspace dependency cycle: ${cycle.join(" -> ")}.`,
            path: `${workspace.path}/package.json`,
          });
        }
      } else if (state.get(target.name) !== "complete") {
        visit(target, nextTrail);
      }
    }

    state.set(workspace.name, "complete");
  }

  for (const workspace of workspaces) {
    if (state.has(workspace.name)) {
      continue;
    }
    visit(workspace, []);
  }

  return violations;
}

function compareViolations(left: BoundaryViolation, right: BoundaryViolation): number {
  return left.path.localeCompare(right.path) || left.code.localeCompare(right.code);
}
