import { fileURLToPath } from "node:url";
import { defaultLicenseCommandDependencies, runLicenseCommand } from "./license-command.js";

const REPOSITORY_ROOT = fileURLToPath(new URL("../../../", import.meta.url));

process.exitCode = runLicenseCommand(REPOSITORY_ROOT, defaultLicenseCommandDependencies());
