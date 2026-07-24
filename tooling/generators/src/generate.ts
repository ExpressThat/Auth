import { fileURLToPath } from "node:url";
import { defaultGeneratorCommandDependencies, runGeneratorCommand } from "./generator-command.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = await runGeneratorCommand(
  REPOSITORY_ROOT,
  process.argv.slice(2),
  defaultGeneratorCommandDependencies(),
);
