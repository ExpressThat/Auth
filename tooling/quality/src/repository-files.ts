import type { Buffer } from "node:buffer";
import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { RepositoryFile } from "./line-checker.js";

type GitResult = {
  output: string;
  status: number | null;
};

export type RepositoryFileDependencies = {
  read: (path: string) => Promise<Buffer>;
  runGit: () => GitResult;
};

export function combineCommandOutput(
  standardOutput: string | null,
  standardError: string | null,
): string {
  return `${standardOutput ?? ""}${standardError ?? ""}`;
}

function runGitFileListing(repositoryRoot: string): GitResult {
  const result = spawnSync(
    "git",
    ["ls-files", "-z", "--cached", "--others", "--exclude-standard"],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
    },
  );

  return {
    output: combineCommandOutput(result.stdout, result.stderr),
    status: result.status,
  };
}

export async function readRepositoryFiles(
  repositoryRoot: string,
  dependencies?: RepositoryFileDependencies,
): Promise<RepositoryFile[]> {
  const selectedDependencies = dependencies ?? {
    read: readFile,
    runGit: () => runGitFileListing(repositoryRoot),
  };
  const result = selectedDependencies.runGit();

  if (result.status !== 0) {
    throw new Error(`Unable to enumerate repository files with git: ${result.output.trim()}`);
  }

  const paths = result.output.split("\0").filter((path) => path.length > 0);

  return Promise.all(
    paths.map(async (path) => ({
      content: await selectedDependencies.read(join(repositoryRoot, path)),
      path,
    })),
  );
}
