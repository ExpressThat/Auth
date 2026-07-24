import { fileURLToPath } from "node:url";
import { findLineViolations } from "./line-checker.js";
import { runLineCommand } from "./line-command.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runLineCommand(REPOSITORY_ROOT, {
  findViolations: findLineViolations,
  readFiles: readRepositoryFiles,
  stderr: process.stderr,
  stdout: process.stdout,
});
