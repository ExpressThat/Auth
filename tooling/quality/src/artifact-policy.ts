import type { RepositoryFile } from "./line-checker.js";

export type ArtifactViolation = {
  path: string;
  reason: string;
};

const GENERATED_DIRECTORY = new Set(["generated", "migrations", "openapi"]);
const SUSPICIOUS_EXTENSIONS = new Set([
  ".db",
  ".dll",
  ".dylib",
  ".exe",
  ".gz",
  ".jks",
  ".key",
  ".node",
  ".p12",
  ".pem",
  ".pfx",
  ".so",
  ".sqlite",
  ".tar",
  ".tgz",
  ".wasm",
  ".zip",
]);
const SUSPICIOUS_FILENAMES = new Set([
  ".env",
  "credentials.json",
  "id_dsa",
  "id_ecdsa",
  "id_ed25519",
  "id_rsa",
  "private-key.json",
  "secrets.json",
]);

function normalize(path: string): string {
  return path.replaceAll("\\", "/");
}

function isGeneratedPath(path: string): boolean {
  const normalized = normalize(path);
  const segments = normalized.split("/");
  const filename = normalized.slice(normalized.lastIndexOf("/") + 1);

  return filename.includes(".generated.") || segments.some((part) => GENERATED_DIRECTORY.has(part));
}

function suspiciousExtension(filename: string): string | undefined {
  for (const extension of SUSPICIOUS_EXTENSIONS) {
    if (filename.endsWith(extension)) {
      return extension;
    }
  }
  return undefined;
}

export function findArtifactViolations(files: ReadonlyArray<RepositoryFile>): ArtifactViolation[] {
  const violations: ArtifactViolation[] = [];

  for (const file of files) {
    if (!isGeneratedPath(file.path)) {
      continue;
    }

    const normalized = normalize(file.path);
    const filename = normalized.slice(normalized.lastIndexOf("/") + 1).toLowerCase();
    const extension = suspiciousExtension(filename);

    if (file.content.includes(0)) {
      violations.push({ path: file.path, reason: "generated source contains binary data" });
    }
    if (SUSPICIOUS_FILENAMES.has(filename) || filename.startsWith(".env.")) {
      violations.push({ path: file.path, reason: "generated path contains a secret-bearing file" });
    }
    if (extension !== undefined) {
      violations.push({
        path: file.path,
        reason: `generated source uses suspicious ${extension} artifact`,
      });
    }
  }

  return violations.sort(
    (left, right) => left.path.localeCompare(right.path) || left.reason.localeCompare(right.reason),
  );
}
