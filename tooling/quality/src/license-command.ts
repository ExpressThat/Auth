import { spawnSync } from "node:child_process";
import { findLicenseViolations, type LicenseViolation } from "./license-policy.js";

type TextWriter = {
  write(message: string): unknown;
};

export type LicenseCommandDependencies = {
  findViolations(source: string): ReadonlyArray<LicenseViolation>;
  listLicenses(root: string): { output: string; status: number | null };
  stderr: TextWriter;
  stdout: TextWriter;
};

export type LicenseProcessRunner = (
  command: string,
  options: { cwd: string; encoding: "utf8"; shell: true },
) => { stderr: string | null; stdout: string | null; status: number | null };

export function combineLicenseOutput(
  standardOutput: string | null,
  standardError: string | null,
): string {
  return `${standardOutput ?? ""}${standardError ?? ""}`;
}

export function listWorkspaceLicenses(
  root: string,
  run: LicenseProcessRunner,
): { output: string; status: number | null } {
  const result = run("pnpm licenses list --json", {
    cwd: root,
    encoding: "utf8",
    shell: true,
  });
  return {
    output: combineLicenseOutput(result.stdout, result.stderr),
    status: result.status,
  };
}

export function defaultLicenseCommandDependencies(
  run: LicenseProcessRunner = spawnSync,
): LicenseCommandDependencies {
  return {
    findViolations: findLicenseViolations,
    listLicenses: (root) => listWorkspaceLicenses(root, run),
    stderr: process.stderr,
    stdout: process.stdout,
  };
}

export function runLicenseCommand(root: string, dependencies: LicenseCommandDependencies): number {
  try {
    const result = dependencies.listLicenses(root);
    if (result.status !== 0) {
      throw new Error(`Unable to inventory dependency licences: ${result.output.trim()}`);
    }

    const violations = dependencies.findViolations(result.output);
    if (violations.length === 0) {
      dependencies.stdout.write("Dependency licences satisfy the reviewed policy.\n");
      return 0;
    }

    for (const violation of violations) {
      dependencies.stderr.write(
        `${violation.package}@${violation.version}: ${violation.license} — ${violation.reason}.\n`,
      );
    }
    return 1;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown licence-policy failure.";
    dependencies.stderr.write(`${message}\n`);
    return 1;
  }
}
