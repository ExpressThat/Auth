import { fileURLToPath } from "node:url";
import { findLineViolations } from "./line-checker.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

try {
  const files = await readRepositoryFiles(REPOSITORY_ROOT);
  const violations = findLineViolations(files);

  if (violations.length === 0) {
    process.stdout.write("First-party files satisfy the 250-line policy.\n");
  } else {
    for (const violation of violations) {
      process.stderr.write(
        `${violation.path}: ${violation.actualLines} lines exceeds ${violation.maximumLines}.\n`,
      );
    }

    process.exitCode = 1;
  }
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown line-policy failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
