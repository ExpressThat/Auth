import type { BoundaryViolation } from "./boundary-model.js";
import type { RepositoryFile } from "./line-checker.js";

type TextWriter = {
  write(message: string): unknown;
};

export type BoundaryCommandDependencies = {
  findViolations(files: ReadonlyArray<RepositoryFile>): Promise<ReadonlyArray<BoundaryViolation>>;
  readFiles(root: string): Promise<ReadonlyArray<RepositoryFile>>;
  stderr: TextWriter;
  stdout: TextWriter;
};

export async function runBoundaryCommand(
  root: string,
  dependencies: BoundaryCommandDependencies,
): Promise<number> {
  try {
    const files = await dependencies.readFiles(root);
    const violations = await dependencies.findViolations(files);

    if (violations.length === 0) {
      dependencies.stdout.write(
        "Workspace dependencies and imports satisfy the boundary policy.\n",
      );
      return 0;
    }

    for (const violation of violations) {
      dependencies.stderr.write(`${violation.path} [${violation.code}]: ${violation.message}\n`);
    }

    return 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown boundary-policy failure.";
    dependencies.stderr.write(`${message}\n`);
    return 1;
  }
}
