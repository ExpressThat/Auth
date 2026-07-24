import { fileURLToPath } from "node:url";
import { findBoundaryViolations } from "./boundary-checker.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

try {
  const files = await readRepositoryFiles(REPOSITORY_ROOT);
  const violations = await findBoundaryViolations(files);

  if (violations.length === 0) {
    process.stdout.write("Workspace dependencies and imports satisfy the boundary policy.\n");
  } else {
    for (const violation of violations) {
      process.stderr.write(`${violation.path} [${violation.code}]: ${violation.message}\n`);
    }
    process.exitCode = 1;
  }
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown boundary-policy failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
