import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { runSuppressionPolicyCommand } from "./security-command.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runSuppressionPolicyCommand({
  readText: (path) => readFile(`${REPOSITORY_ROOT}/${path}`, "utf8"),
  today: () => new Date().toISOString().slice(0, 10),
  writeError: (message) => process.stderr.write(`${message}\n`),
  writeOutput: (message) => process.stdout.write(`${message}\n`),
});
