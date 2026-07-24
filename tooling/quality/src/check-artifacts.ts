import { fileURLToPath } from "node:url";
import { runArtifactCommand } from "./artifact-command.js";
import { findArtifactViolations } from "./artifact-policy.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runArtifactCommand(REPOSITORY_ROOT, {
  findViolations: findArtifactViolations,
  readFiles: readRepositoryFiles,
  stderr: process.stderr,
  stdout: process.stdout,
});
