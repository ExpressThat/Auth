import { fileURLToPath } from "node:url";
import { runDocumentationCommand } from "./documentation-command.js";
import { findDocumentationViolations } from "./documentation-policy.js";
import { readDocumentationRepository } from "./documentation-reader.js";
import { readRepositoryFiles } from "./repository-files.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runDocumentationCommand({
  findViolations: async () =>
    findDocumentationViolations(
      readDocumentationRepository(await readRepositoryFiles(REPOSITORY_ROOT)),
    ),
  writeError: (message) => process.stderr.write(`${message}\n`),
  writeOutput: (message) => process.stdout.write(`${message}\n`),
});
