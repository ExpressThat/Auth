import type { LineViolation, RepositoryFile } from "./line-checker.js";

type TextWriter = {
  write(message: string): unknown;
};

export type LineCommandDependencies = {
  findViolations(files: ReadonlyArray<RepositoryFile>): ReadonlyArray<LineViolation>;
  readFiles(root: string): Promise<ReadonlyArray<RepositoryFile>>;
  stderr: TextWriter;
  stdout: TextWriter;
};

export async function runLineCommand(
  root: string,
  dependencies: LineCommandDependencies,
): Promise<number> {
  try {
    const files = await dependencies.readFiles(root);
    const violations = dependencies.findViolations(files);

    if (violations.length === 0) {
      dependencies.stdout.write("First-party files satisfy the 250-line policy.\n");
      return 0;
    }

    for (const violation of violations) {
      dependencies.stderr.write(
        `${violation.path}: ${violation.actualLines} lines exceeds ${violation.maximumLines}.\n`,
      );
    }

    return 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown line-policy failure.";
    dependencies.stderr.write(`${message}\n`);
    return 1;
  }
}
