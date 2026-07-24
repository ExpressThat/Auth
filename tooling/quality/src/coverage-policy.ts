import { z } from "zod";
import type { RepositoryFile } from "./line-checker.js";

const manifestSchema = z.object({
  scripts: z.record(z.string(), z.string()).optional(),
});

export type CoveragePolicyViolation = {
  code: "missing-coverage-script" | "missing-shared-preset" | "missing-test-script";
  path: string;
};

export function findCoveragePolicyViolations(
  files: ReadonlyArray<RepositoryFile>,
): CoveragePolicyViolation[] {
  const violations: CoveragePolicyViolation[] = [];

  for (const file of files) {
    const root = workspaceRoot(file.path);

    if (root === undefined || !hasExecutableSource(files, root)) {
      continue;
    }

    const manifest = decodeManifest(file);
    if (manifest.scripts === undefined || !("test" in manifest.scripts)) {
      violations.push({ code: "missing-test-script", path: file.path });
    }
    if (manifest.scripts?.["test:coverage"] === undefined) {
      violations.push({ code: "missing-coverage-script", path: file.path });
    }
    if (!usesSharedCoveragePreset(files, root)) {
      violations.push({ code: "missing-shared-preset", path: file.path });
    }
  }

  return violations.sort(
    (left, right) => left.path.localeCompare(right.path) || left.code.localeCompare(right.code),
  );
}

function workspaceRoot(path: string): string | undefined {
  const normalized = path.replaceAll("\\", "/");
  const match = /^(apps|deploy|packages|tooling)\/[^/]+\/package\.json$/u.exec(normalized);
  return match ? normalized.replace(/\/package\.json$/u, "") : undefined;
}

function hasExecutableSource(files: ReadonlyArray<RepositoryFile>, root: string): boolean {
  return files.some((file) => {
    const path = file.path.replaceAll("\\", "/");
    return (
      path.startsWith(`${root}/src/`) &&
      /\.(?:ts|tsx)$/u.test(path) &&
      !path.endsWith(".d.ts") &&
      !path.includes("/generated/") &&
      !path.includes("/vendor/") &&
      !path.includes(".generated.")
    );
  });
}

function usesSharedCoveragePreset(files: ReadonlyArray<RepositoryFile>, root: string): boolean {
  return files.some((file) => {
    const path = file.path.replaceAll("\\", "/");
    if (!path.startsWith(`${root}/vitest`) || !path.endsWith(".config.ts")) {
      return false;
    }
    const source = file.content.toString("utf8");
    return (
      source.includes('"@expressthat-auth/test-config/vitest"') ||
      source.includes('"@expressthat-auth/test-config/component"')
    );
  });
}

function decodeManifest(file: RepositoryFile): z.infer<typeof manifestSchema> {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the manifest schema.
  const untrustedManifest: unknown = JSON.parse(file.content.toString("utf8"));
  return manifestSchema.parse(untrustedManifest);
}
