import type { Buffer } from "node:buffer";
import { findLineExemption, MAX_FIRST_PARTY_LINES } from "./line-policy.js";

export type RepositoryFile = {
  content: Buffer;
  path: string;
};

export type LineViolation = {
  actualLines: number;
  maximumLines: number;
  path: string;
};

export function countPhysicalLines(content: string): number {
  if (content.length === 0) {
    return 0;
  }

  const lines = content.split(/\r\n|\r|\n/u);
  return lines.at(-1) === "" ? lines.length - 1 : lines.length;
}

export function findLineViolations(files: RepositoryFile[]): LineViolation[] {
  const violations: LineViolation[] = [];

  for (const file of files) {
    if (findLineExemption(file.path, file.content) !== undefined) {
      continue;
    }

    const actualLines = countPhysicalLines(file.content.toString("utf8"));

    if (actualLines > MAX_FIRST_PARTY_LINES) {
      violations.push({
        actualLines,
        maximumLines: MAX_FIRST_PARTY_LINES,
        path: file.path,
      });
    }
  }

  return violations.sort((left, right) => left.path.localeCompare(right.path));
}
