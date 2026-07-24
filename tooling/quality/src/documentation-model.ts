export type DocumentationViolation = {
  owner: string;
  path: string;
  reason: string;
};

export type DocumentationFile = {
  content: string;
  path: string;
};

export type DocumentationWorkspace = {
  name: string;
  path: string;
};

export type DocumentationRepository = {
  files: ReadonlyMap<string, DocumentationFile>;
  rootScripts: ReadonlySet<string>;
  workspaces: ReadonlyArray<DocumentationWorkspace>;
};
