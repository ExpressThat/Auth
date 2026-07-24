import { fileURLToPath } from "node:url";
import { findBoundaryViolations } from "./boundary-checker.js";
import { runBoundaryCommand } from "./boundary-command.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runBoundaryCommand(REPOSITORY_ROOT, {
  findViolations: findBoundaryViolations,
  readFiles: readRepositoryFiles,
  stderr: process.stderr,
  stdout: process.stdout,
});
