import type {
  BoundaryViolation,
  InfrastructureAdapterCategory,
  InfrastructureAdapterMetadata,
  Workspace,
} from "./boundary-model.js";

const PROVIDER_ROOT = "packages/providers/";
const RUNTIME_PACKAGE = "@expressthat-auth/runtime";
const CATEGORIES: readonly InfrastructureAdapterCategory[] = [
  "cache",
  "certificate",
  "deployment",
  "dns",
  "key-management",
  "object-storage",
  "observability",
  "queue",
  "secret",
];

export function findAdapterPackagingViolations(workspaces: Workspace[]): BoundaryViolation[] {
  const violations: BoundaryViolation[] = [];
  for (const workspace of workspaces) {
    inspectWorkspace(workspace, violations);
  }
  return violations.sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
}

function inspectWorkspace(workspace: Workspace, violations: BoundaryViolation[]): void {
  const basename = directProviderBasename(workspace.path);
  const reservedCategory = basename === undefined ? undefined : categoryFromBasename(basename);
  const metadata = workspace.infrastructureAdapter;

  if (metadata === undefined) {
    if (reservedCategory !== undefined) {
      report(
        workspace,
        violations,
        "missing-adapter-metadata",
        `${workspace.name} uses the reserved ${reservedCategory} adapter prefix without infrastructure metadata.`,
      );
    }
    return;
  }
  if (basename === undefined) {
    report(
      workspace,
      violations,
      "adapter-location",
      `${workspace.name} infrastructure adapters must be direct packages under ${PROVIDER_ROOT}.`,
    );
    return;
  }

  inspectIdentity(workspace, metadata, basename, violations);
  inspectExports(workspace, violations);
  inspectRuntimeDependency(workspace, violations);
  inspectRuntimeSupport(workspace, metadata, violations);
}

function inspectIdentity(
  workspace: Workspace,
  metadata: InfrastructureAdapterMetadata,
  basename: string,
  violations: BoundaryViolation[],
): void {
  if (
    workspace.name !== `@expressthat-auth/${basename}` ||
    !basename.startsWith(`${metadata.category}-`)
  ) {
    report(
      workspace,
      violations,
      "adapter-identity",
      `${workspace.name} must match its directory and ${metadata.category}- category prefix.`,
    );
  }
}

function inspectExports(workspace: Workspace, violations: BoundaryViolation[]): void {
  for (const requiredExport of [".", "./manifest"]) {
    if (!workspace.exports.has(requiredExport)) {
      report(
        workspace,
        violations,
        "adapter-export",
        `${workspace.name} must explicitly export ${requiredExport}.`,
      );
    }
  }
}

function inspectRuntimeDependency(workspace: Workspace, violations: BoundaryViolation[]): void {
  const dependency = workspace.dependencies.find((candidate) => candidate.name === RUNTIME_PACKAGE);
  if (dependency?.section !== "dependencies") {
    report(
      workspace,
      violations,
      "adapter-runtime-contract",
      `${workspace.name} must declare ${RUNTIME_PACKAGE} as a production dependency.`,
    );
  }
}

function inspectRuntimeSupport(
  workspace: Workspace,
  metadata: InfrastructureAdapterMetadata,
  violations: BoundaryViolation[],
): void {
  const support = metadata.runtimeSupport;
  if (support.node.maximumMajorExclusive <= support.node.minimumMajor) {
    report(
      workspace,
      violations,
      "adapter-node-range",
      `${workspace.name} declares an empty Node major-version range.`,
    );
  }
  for (const [label, values] of [
    ["container architectures", support.containerArchitectures],
    ["external capabilities", support.externalCapabilities],
    ["operating systems", support.operatingSystems],
  ] as const) {
    if (new Set(values).size !== values.length) {
      report(
        workspace,
        violations,
        "adapter-runtime-duplicate",
        `${workspace.name} repeats declared ${label}.`,
      );
    }
  }
}

function categoryFromBasename(basename: string): InfrastructureAdapterCategory | undefined {
  return CATEGORIES.find((category) => basename.startsWith(`${category}-`));
}

function directProviderBasename(path: string): string | undefined {
  if (!path.startsWith(PROVIDER_ROOT)) {
    return undefined;
  }
  const basename = path.slice(PROVIDER_ROOT.length);
  return basename.length > 0 && !basename.includes("/") ? basename : undefined;
}

function report(
  workspace: Workspace,
  violations: BoundaryViolation[],
  code: string,
  message: string,
): void {
  violations.push({ code, message, path: `${workspace.path}/package.json` });
}
