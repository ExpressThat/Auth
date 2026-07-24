import type { ArtifactViolation } from "./artifact-policy.js";
import type { RepositoryFile } from "./line-checker.js";

type TextWriter = {
  write(message: string): unknown;
};

export type ArtifactCommandDependencies = {
  findViolations(files: ReadonlyArray<RepositoryFile>): ReadonlyArray<ArtifactViolation>;
  readFiles(root: string): Promise<ReadonlyArray<RepositoryFile>>;
  stderr: TextWriter;
  stdout: TextWriter;
};

export async function runArtifactCommand(
  root: string,
  dependencies: ArtifactCommandDependencies,
): Promise<number> {
  try {
    const violations = dependencies.findViolations(await dependencies.readFiles(root));

    if (violations.length === 0) {
      dependencies.stdout.write("Generated artifacts satisfy the repository security policy.\n");
      return 0;
    }

    for (const violation of violations) {
      dependencies.stderr.write(`${violation.path}: ${violation.reason}.\n`);
    }
    return 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown artifact-policy failure.";
    dependencies.stderr.write(`${message}\n`);
    return 1;
  }
}
