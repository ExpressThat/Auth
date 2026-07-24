export type DependencySection =
  | "dependencies"
  | "devDependencies"
  | "optionalDependencies"
  | "peerDependencies";

export type WorkspaceKind =
  | "application"
  | "conformance"
  | "deployment"
  | "implementation"
  | "runtime-neutral"
  | "shared-config"
  | "tooling";

export type WorkspaceDependency = {
  name: string;
  section: DependencySection;
};

export type Workspace = {
  dependencies: WorkspaceDependency[];
  exports: Set<string>;
  kind: WorkspaceKind;
  name: string;
  path: string;
};

export type BoundaryViolation = {
  code: string;
  message: string;
  path: string;
};
