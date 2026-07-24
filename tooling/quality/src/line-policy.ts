import type { Buffer } from "node:buffer";

export const MAX_FIRST_PARTY_LINES = 250;

export type LineExemption =
  | "binary content"
  | "documentation"
  | "generated content"
  | "generated output"
  | "lockfile"
  | "third-party code"
  | "tool output";

const EXEMPT_FILENAMES = new Map<string, LineExemption>([
  ["worker-configuration.d.ts", "generated content"],
  ["pnpm-lock.yaml", "lockfile"],
  ["package-lock.json", "lockfile"],
  ["yarn.lock", "lockfile"],
]);

const EXEMPT_EXTENSIONS = new Map<string, LineExemption>([
  [".md", "documentation"],
  [".mdx", "documentation"],
  [".tsbuildinfo", "generated content"],
]);

const EXEMPT_DIRECTORY_SEGMENTS = new Map<string, LineExemption>([
  [".turbo", "tool output"],
  ["coverage", "tool output"],
  ["dist", "generated output"],
  ["generated", "generated content"],
  ["node_modules", "third-party code"],
  ["playwright-report", "tool output"],
  ["test-results", "tool output"],
  ["third_party", "third-party code"],
  ["vendor", "third-party code"],
]);

export function findLineExemption(path: string, content: Buffer): LineExemption | undefined {
  const normalizedPath = path.replaceAll("\\", "/");
  const filename = normalizedPath.slice(normalizedPath.lastIndexOf("/") + 1);
  const filenameExemption = EXEMPT_FILENAMES.get(filename);

  if (filenameExemption !== undefined) {
    return filenameExemption;
  }

  for (const [extension, reason] of EXEMPT_EXTENSIONS) {
    if (filename.endsWith(extension)) {
      return reason;
    }
  }

  if (filename.includes(".generated.")) {
    return "generated content";
  }

  for (const segment of normalizedPath.split("/")) {
    const directoryExemption = EXEMPT_DIRECTORY_SEGMENTS.get(segment);

    if (directoryExemption !== undefined) {
      return directoryExemption;
    }
  }

  if (content.includes(0)) {
    return "binary content";
  }

  return undefined;
}
