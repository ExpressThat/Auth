import { type Class, parseSync, type VariableDeclaration } from "oxc-parser";
import type { BoundaryViolation, Workspace } from "./boundary-model.js";
import type { RepositoryFile } from "./line-checker.js";

const SOURCE_EXTENSION = /\.(?:[cm]?[jt]sx?)$/u;
const MUTABLE_CONSTRUCTORS = new Set(["Map", "Set", "WeakMap", "WeakSet"]);
const PROCESS_STATE_PACKAGES = new Set([
  "async-lock",
  "async-mutex",
  "lru-cache",
  "node-cache",
  "p-memoize",
  "quick-lru",
  "semaphore-async-await",
]);
const STATELESS_PRODUCT_WORKSPACES = new Set([
  "@expressthat-auth/auth-protocols",
  "@expressthat-auth/authorization",
  "@expressthat-auth/domain",
]);
const SENSITIVE_STATE_NAME =
  /(?:authorization|cache|consent|job|lock|nonce|permission|rate.?limit|recovery|revocation|session|tenant|token)/iu;

export function findProcessStateViolations(
  workspaces: Workspace[],
  files: RepositoryFile[],
): BoundaryViolation[] {
  const servicePaths = workspaces
    .filter(isStatelessService)
    .map((workspace) => workspace.path.replaceAll("\\", "/"));
  const violations: BoundaryViolation[] = [];

  for (const file of files) {
    const path = file.path.replaceAll("\\", "/");
    if (!isProductionServiceSource(path, servicePaths)) {
      continue;
    }
    inspectServiceSource(path, file.content.toString("utf8"), violations);
  }
  return violations;
}

function isStatelessService(workspace: Workspace): boolean {
  return (
    (workspace.kind === "application" && !workspace.name.endsWith("-web")) ||
    STATELESS_PRODUCT_WORKSPACES.has(workspace.name)
  );
}

function isProductionServiceSource(path: string, servicePaths: string[]): boolean {
  return (
    SOURCE_EXTENSION.test(path) &&
    servicePaths.some((workspacePath) => path.startsWith(`${workspacePath}/src/`))
  );
}

function inspectServiceSource(path: string, source: string, violations: BoundaryViolation[]): void {
  const parsed = parseSync(path, source);
  for (const imported of parsed.module.staticImports) {
    const specifier = imported.moduleRequest.value;
    if (isProcessStatePackage(specifier)) {
      violations.push({
        code: "process-state-package",
        message: `${specifier} cannot provide cross-request coordination in a stateless service.`,
        path,
      });
    }
  }
  for (const statement of parsed.program.body) {
    inspectTopLevelDeclaration(unwrapDeclaration(statement), path, violations);
  }
}

function unwrapDeclaration(statement: unknown): unknown {
  const type = stringProperty(statement, "type");
  if (type === "ExportNamedDeclaration" || type === "ExportDefaultDeclaration") {
    return property(statement, "declaration");
  }
  return statement;
}

function inspectTopLevelDeclaration(
  declaration: unknown,
  path: string,
  violations: BoundaryViolation[],
): void {
  if (isVariableDeclaration(declaration)) {
    inspectModuleVariables(declaration, path, violations);
  } else if (isClassDeclaration(declaration)) {
    inspectClass(declaration, path, violations);
  }
}

function inspectModuleVariables(
  declaration: VariableDeclaration,
  path: string,
  violations: BoundaryViolation[],
): void {
  const kind = declaration.kind;
  for (const item of declaration.declarations) {
    const name = identifierName(property(item, "id"));
    const initializer = unwrapExpression(property(item, "init"));
    if (kind === "let" || kind === "var") {
      addViolation(
        "module-mutable-state",
        `${name} is mutable module state in a stateless service.`,
        path,
        violations,
      );
    } else if (
      isMutableContainer(initializer) ||
      (SENSITIVE_STATE_NAME.test(name) && isConstructedState(initializer))
    ) {
      addViolation(
        "module-process-state",
        `${name} can retain cross-request process state; inject a shared adapter instead.`,
        path,
        violations,
      );
    }
  }
}

function inspectClass(declaration: Class, path: string, violations: BoundaryViolation[]): void {
  for (const member of declaration.body.body) {
    if (stringProperty(member, "type") !== "PropertyDefinition") {
      continue;
    }
    const name = identifierName(property(member, "key"));
    const initializer = unwrapExpression(property(member, "value"));
    if (
      isMutableContainer(initializer) ||
      (SENSITIVE_STATE_NAME.test(name) && isConstructedState(initializer))
    ) {
      addViolation(
        "instance-process-state",
        `${name} can retain cross-request process state on a service instance.`,
        path,
        violations,
      );
    }
  }
}

function unwrapExpression(value: unknown): unknown {
  const wrappers = new Set([
    "ParenthesizedExpression",
    "TSAsExpression",
    "TSNonNullExpression",
    "TSSatisfiesExpression",
    "TSTypeAssertion",
  ]);
  let selected = value;
  while (wrappers.has(stringProperty(selected, "type"))) {
    selected = property(selected, "expression");
  }
  return selected;
}

function isMutableCollection(value: unknown): boolean {
  return (
    stringProperty(value, "type") === "NewExpression" &&
    MUTABLE_CONSTRUCTORS.has(identifierName(property(value, "callee")))
  );
}

function isMutableContainer(value: unknown): boolean {
  const type = stringProperty(value, "type");
  return type === "ArrayExpression" || type === "ObjectExpression" || isMutableCollection(value);
}

function isConstructedState(value: unknown): boolean {
  const type = stringProperty(value, "type");
  return type === "NewExpression" || type === "CallExpression";
}

function isProcessStatePackage(specifier: string): boolean {
  return [...PROCESS_STATE_PACKAGES].some(
    (packageName) => specifier === packageName || specifier.startsWith(`${packageName}/`),
  );
}

function identifierName(value: unknown): string {
  return stringProperty(value, "name") || "<anonymous>";
}

function property(value: unknown, name: string): unknown {
  if (value === null || typeof value !== "object") {
    return undefined;
  }
  return Reflect.get(value, name);
}

function stringProperty(value: unknown, name: string): string {
  const selected = property(value, name);
  return typeof selected === "string" ? selected : "";
}

function isVariableDeclaration(value: unknown): value is VariableDeclaration {
  return stringProperty(value, "type") === "VariableDeclaration";
}

function isClassDeclaration(value: unknown): value is Class {
  const type = stringProperty(value, "type");
  return type === "ClassDeclaration" || type === "ClassExpression";
}

function addViolation(
  code: string,
  message: string,
  path: string,
  violations: BoundaryViolation[],
): void {
  violations.push({ code, message, path });
}
