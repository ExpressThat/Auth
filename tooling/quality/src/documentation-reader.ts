import { z } from "zod";
import type {
  DocumentationFile,
  DocumentationRepository,
  DocumentationWorkspace,
} from "./documentation-model.js";
import type { RepositoryFile } from "./line-checker.js";

const manifestSchema = z.object({
  name: z.string().min(1),
  scripts: z.record(z.string(), z.string()).optional(),
});

function normalize(path: string): string {
  return path.replaceAll("\\", "/");
}

function decodeManifest(file: RepositoryFile): z.infer<typeof manifestSchema> {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the manifest schema.
  const untrustedManifest: unknown = JSON.parse(file.content.toString("utf8"));
  return manifestSchema.parse(untrustedManifest);
}

export function readDocumentationRepository(
  repositoryFiles: ReadonlyArray<RepositoryFile>,
): DocumentationRepository {
  const files = new Map<string, DocumentationFile>();
  const workspaces: DocumentationWorkspace[] = [];
  let rootScripts = new Set<string>();

  for (const repositoryFile of repositoryFiles) {
    const path = normalize(repositoryFile.path);
    files.set(path, { content: repositoryFile.content.toString("utf8"), path });

    if (path === "package.json") {
      rootScripts = new Set(Object.keys(decodeManifest(repositoryFile).scripts ?? {}));
    } else if (/^(apps|deploy|packages|tooling)\/.+\/package\.json$/u.test(path)) {
      workspaces.push({
        name: decodeManifest(repositoryFile).name,
        path: path.replace(/\/package\.json$/u, ""),
      });
    }
  }

  return {
    files,
    rootScripts,
    workspaces: workspaces.sort((left, right) => left.name.localeCompare(right.name)),
  };
}
