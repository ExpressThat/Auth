import { createHash } from "node:crypto";
import { posix } from "node:path";
import type {
  DocumentationFile,
  DocumentationRepository,
  DocumentationViolation,
} from "./documentation-model.js";

const REQUIRED_ROOT_DOCUMENTS = [
  "AUTH_SOLUTION_OVERVIEW.md",
  "CONTRIBUTING.md",
  "IMPLEMENTATION_TASKS.md",
  "README.md",
  "SECURITY.md",
];
const LINK_PATTERN = /(?<!!)\[[^\]]+\]\([^)]+\)/gu;
const BASH_BLOCK_PATTERN = /```(?:bash|sh|shell)\s*\n[\s\S]*?```/gu;
const GENERATED_MARKER = /<!-- generated-from: [^;]+; sha256: [a-f0-9]{64} -->/u;
const VERSION_MARKER = /<!-- documentation-version: [^>]+ -->/u;
const INTERNAL_MARKER = "<!-- visibility: internal -->";
const HOSTED_TERM = /(?<!self-)hosted/u;
const UNSAFE_EXAMPLE_PATTERNS = [
  /\bcurl\b[^\n|]*\|\s*(?:ba)?sh\b/u,
  /\brm\s+-rf\b/u,
  /\bNODE_TLS_REJECT_UNAUTHORIZED\s*=\s*0\b/u,
  /\b(?:password|secret|token)\s*=\s*["']?(?!example|synthetic|test)/iu,
];

function ownerFor(path: string): string {
  const segments = path.split("/");
  const root = segments.slice(0, 1).join();
  if (root === "docs") {
    return `documentation:${segments[1]}`;
  }
  if (["apps", "deploy", "packages", "tooling"].includes(root)) {
    return segments.slice(0, 2).join("/");
  }
  return "repository";
}

function violation(path: string, reason: string, owner = ownerFor(path)): DocumentationViolation {
  return { owner, path, reason };
}

function markdownFiles(repository: DocumentationRepository): DocumentationFile[] {
  return [...repository.files.values()].filter((file) => file.path.endsWith(".md"));
}

function localTarget(sourcePath: string, target: string): string | undefined {
  const cleaned = target.trim().replace(/^<|>$/gu, "").replace(/#.*$/u, "");
  if (
    cleaned.length === 0 ||
    /^(?:[a-z][a-z0-9+.-]*:|#)/iu.test(cleaned) ||
    cleaned.startsWith("/")
  ) {
    return undefined;
  }
  try {
    return posix.normalize(posix.join(posix.dirname(sourcePath), decodeURIComponent(cleaned)));
  } catch {
    return posix.normalize(posix.join(posix.dirname(sourcePath), cleaned));
  }
}

function findLinkViolations(
  repository: DocumentationRepository,
  file: DocumentationFile,
): DocumentationViolation[] {
  const violations: DocumentationViolation[] = [];
  for (const match of file.content.matchAll(LINK_PATTERN)) {
    const rawTarget = match[0].slice(match[0].lastIndexOf("(") + 1, -1);
    const target = localTarget(file.path, rawTarget);
    if (target === undefined) {
      continue;
    }
    const resolved = repository.files.has(target) || repository.files.has(`${target}/README.md`);
    if (!resolved) {
      violations.push(violation(file.path, `local link does not resolve: ${rawTarget}`));
    }
    if (file.path.startsWith("docs/public/") && target.startsWith("docs/internal/")) {
      violations.push(violation(file.path, `public documentation links internally: ${rawTarget}`));
    }
  }
  return violations;
}

function findExampleViolations(
  repository: DocumentationRepository,
  file: DocumentationFile,
): DocumentationViolation[] {
  const violations: DocumentationViolation[] = [];
  for (const match of file.content.matchAll(BASH_BLOCK_PATTERN)) {
    const body = match[0].slice(match[0].indexOf("\n") + 1, -3);
    if (UNSAFE_EXAMPLE_PATTERNS.some((pattern) => pattern.test(body))) {
      violations.push(violation(file.path, "shell example contains a prohibited unsafe pattern"));
    }
    for (const line of body.split("\n")) {
      const trimmed = line.trim();
      const script = /^pnpm [a-z]/u.test(trimmed)
        ? trimmed.slice("pnpm ".length).replace(/\s.*$/u, "")
        : undefined;
      if (
        script !== undefined &&
        !["add", "audit", "exec", "install", "remove", "scaffold"].includes(script) &&
        !repository.rootScripts.has(script)
      ) {
        violations.push(
          violation(file.path, `shell example references unknown pnpm script: ${script}`),
        );
      }
    }
  }
  return violations;
}

function findGeneratedDrift(
  repository: DocumentationRepository,
  file: DocumentationFile,
): DocumentationViolation[] {
  if (!/(?:^|\/)generated\/.*\.md$|\.generated\.md$/u.test(file.path)) {
    return [];
  }
  const marker = GENERATED_MARKER.exec(file.content);
  if (marker === null) {
    return [violation(file.path, "generated documentation lacks source and SHA-256 marker")];
  }
  const metadata = marker[0].slice("<!-- generated-from: ".length, -" -->".length);
  const separator = "; sha256: ";
  const separatorIndex = metadata.lastIndexOf(separator);
  const source = metadata.slice(0, separatorIndex);
  const expectedHash = metadata.slice(separatorIndex + separator.length);
  const sourceFile = repository.files.get(posix.normalize(source));
  if (sourceFile === undefined) {
    return [violation(file.path, `generated documentation source does not exist: ${source}`)];
  }
  const actualHash = createHash("sha256").update(sourceFile.content).digest("hex");
  return actualHash === expectedHash
    ? []
    : [violation(file.path, `generated documentation is stale for source: ${source}`)];
}

function workspaceViolations(repository: DocumentationRepository): DocumentationViolation[] {
  const violations: DocumentationViolation[] = [];
  for (const workspace of repository.workspaces) {
    const readmePath = `${workspace.path}/README.md`;
    const readme = repository.files.get(readmePath);
    if (readme === undefined) {
      violations.push(violation(workspace.path, "workspace README.md is required", workspace.name));
      continue;
    }
    if (
      (workspace.name.endsWith("-api") || workspace.name.endsWith("/api-contracts")) &&
      !readme.content.includes("OpenAPI")
    ) {
      violations.push(
        violation(readmePath, "API workspace README must reference OpenAPI", workspace.name),
      );
    }
    if (
      workspace.path.startsWith("deploy/") &&
      (!HOSTED_TERM.test(readme.content) || !readme.content.includes("self-hosted"))
    ) {
      violations.push(
        violation(
          readmePath,
          "deployment README must distinguish hosted and self-hosted operation",
          workspace.name,
        ),
      );
    }
  }
  return violations;
}

export function findDocumentationViolations(
  repository: DocumentationRepository,
): DocumentationViolation[] {
  const violations = workspaceViolations(repository);
  for (const path of REQUIRED_ROOT_DOCUMENTS) {
    if (!repository.files.has(path)) {
      violations.push(violation(path, "required root documentation is missing"));
    }
  }
  for (const file of markdownFiles(repository)) {
    violations.push(...findLinkViolations(repository, file));
    violations.push(...findExampleViolations(repository, file));
    violations.push(...findGeneratedDrift(repository, file));
    if (
      /^(?:docs\/releases\/versions|docs\/versions|openapi)\/.+\.md$/u.test(file.path) &&
      !VERSION_MARKER.test(file.content)
    ) {
      violations.push(violation(file.path, "versioned documentation lacks a version marker"));
    }
    if (file.path.startsWith("docs/internal/") && !file.content.includes(INTERNAL_MARKER)) {
      violations.push(violation(file.path, "internal documentation lacks a visibility marker"));
    }
  }
  return violations.sort(
    (left, right) => left.path.localeCompare(right.path) || left.reason.localeCompare(right.reason),
  );
}
