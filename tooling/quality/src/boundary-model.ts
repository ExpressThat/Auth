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

export type InfrastructureAdapterCategory =
  | "cache"
  | "certificate"
  | "deployment"
  | "dns"
  | "key-management"
  | "object-storage"
  | "observability"
  | "queue"
  | "secret";

export type InfrastructureAdapterMetadata = {
  category: InfrastructureAdapterCategory;
  runtimeSupport: {
    containerArchitectures: string[];
    externalCapabilities: string[];
    node: {
      maximumMajorExclusive: number;
      minimumMajor: number;
    };
    operatingSystems: string[];
  };
};

export type WorkspaceDependency = {
  name: string;
  section: DependencySection;
};

export type Workspace = {
  dependencies: WorkspaceDependency[];
  exports: Set<string>;
  infrastructureAdapter?: InfrastructureAdapterMetadata;
  kind: WorkspaceKind;
  name: string;
  path: string;
  scripts: Set<string>;
};

export type BoundaryViolation = {
  code: string;
  message: string;
  path: string;
};
