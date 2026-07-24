import { describe, expect, it } from "vitest";
import { findProcessStateViolations } from "../src/process-state-policy.js";
import { file, workspace } from "./boundary-fixtures.js";

function service() {
  const selected = workspace("@expressthat-auth/auth-api", "application");
  selected.path = "apps/auth-api";
  return selected;
}

describe("stateless service source policy", () => {
  it("allows request-local values, primitives, frozen metadata, and injected fields", () => {
    const source = [
      'export const SERVICE_NAME = "auth-api";',
      'export const ROUTES = Object.freeze({ health: "/health" });',
      "const safe = 1; export { safe };",
      "export function handle() {",
      "  const requestMemo = new Map<string, string>();",
      "  return requestMemo;",
      "}",
      "export class Handler {",
      "  readonly sessions;",
      "  constructor(sessions: object) { this.sessions = sessions; }",
      "}",
    ].join("\n");

    expect(
      findProcessStateViolations(
        [service()],
        [
          file("apps/auth-api/src/handler.ts", source),
          file("apps/auth-api/test/handler.test.ts", "const sessions = new Map();"),
          file("apps/auth-api/README.md", "const sessions = new Map();"),
        ],
      ),
    ).toEqual([]);
  });

  it("ignores browser and infrastructure-contract production workspaces", () => {
    const browser = workspace("@expressthat-auth/auth-web", "application");
    browser.path = "apps/auth-web";
    const runtime = workspace("@expressthat-auth/runtime");

    expect(
      findProcessStateViolations(
        [browser, runtime],
        [
          file("apps/auth-web/src/store.ts", "export const state = new Map();"),
          file("packages/runtime/src/registry.ts", "export const state = new Map();"),
        ],
      ),
    ).toEqual([]);
  });

  it.each([
    "@expressthat-auth/auth-protocols",
    "@expressthat-auth/authorization",
    "@expressthat-auth/domain",
  ])("enforces statelessness in %s", (name) => {
    const selected = workspace(name);

    expect(
      findProcessStateViolations(
        [selected],
        [file(`${selected.path}/src/state.ts`, "export const sessions = new Map();")],
      ),
    ).toEqual([
      expect.objectContaining({
        code: "module-process-state",
      }),
    ]);
  });

  it("rejects process-local packages and persistent module or instance state", () => {
    const source = [
      'import "lru-cache";',
      'import "async-mutex/internal";',
      "export let active = 0;",
      "var owner;",
      "export const registry = new Map();",
      "const routes = [] as const;",
      "const settings = {};",
      "const { state } = {};",
      "export const sessionStore = createStore();",
      "const sessionFactory = Factory.freeze({});",
      "const tokenFactory = Object.create(null);",
      "class Service {",
      "  #nonces = new Set();",
      "  authorizationCache = new LocalCache();",
      "}",
    ].join("\n");

    expect(
      findProcessStateViolations([service()], [file("apps/auth-api/src/service.ts", source)]).map(
        (violation) => violation.code,
      ),
    ).toEqual([
      "process-state-package",
      "process-state-package",
      "module-mutable-state",
      "module-mutable-state",
      "module-process-state",
      "module-process-state",
      "module-process-state",
      "module-process-state",
      "module-process-state",
      "module-process-state",
      "module-process-state",
      "instance-process-state",
      "instance-process-state",
    ]);
  });

  it("detects exported default classes and redacts implementation values from messages", () => {
    const [violation] = findProcessStateViolations(
      [service()],
      [
        file(
          "apps/auth-api/src/default.ts",
          "export default class Service { tenantTokens = new SecretTokenStore(); }",
        ),
      ],
    );

    expect(violation).toEqual({
      code: "instance-process-state",
      message: "tenantTokens can retain cross-request process state on a service instance.",
      path: "apps/auth-api/src/default.ts",
    });
    expect(JSON.stringify(violation)).not.toContain("SecretTokenStore");
  });
});
