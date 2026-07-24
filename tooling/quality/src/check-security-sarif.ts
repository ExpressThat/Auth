import { readFile } from "node:fs/promises";
import { isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runSarifPolicyCommand } from "./security-command.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

try {
  process.exitCode = await runSarifPolicyCommand(process.argv.slice(2), {
    readText: (path) => readFile(isAbsolute(path) ? path : resolve(REPOSITORY_ROOT, path), "utf8"),
    today: () => new Date().toISOString().slice(0, 10),
    writeError: (message) => process.stderr.write(`${message}\n`),
    writeOutput: (message) => process.stdout.write(`${message}\n`),
  });
} catch {
  process.stderr.write("Security report could not be evaluated safely.\n");
  process.exitCode = 1;
}
