import { describe, expect, it } from "vitest";
import { createRoutePlan } from "../src/route-plan.js";

describe("route generation plan", () => {
  it("adds a public typed route, test, documentation, and exact dependencies", () => {
    const plan = createRoutePlan(
      "auth-api",
      "health-check",
      JSON.stringify({
        dependencies: { hono: "4.12.31" },
        exports: { ".": "./src/index.ts" },
        name: "@expressthat-auth/auth-api",
        private: true,
      }),
    );
    const manifestChange = plan.changes[0];
    const manifest = JSON.parse(manifestChange?.content ?? "{}");

    expect(manifestChange?.mode).toBe("replace");
    expect(manifest.exports["./routes/health-check"]).toBe("./src/routes/health-check.ts");
    expect(manifest.dependencies).toEqual({
      "@hono/zod-openapi": "1.5.1",
      hono: "4.12.31",
      zod: "4.4.3",
    });
    expect(manifest.scripts["test:coverage"]).toBe("vitest run --coverage");
    expect(manifest.devDependencies["@expressthat-auth/test-config"]).toBe("workspace:*");
    expect(manifest.private).toBe(true);
    expect(plan.changes.map((change) => change.path)).toEqual([
      "apps/auth-api/package.json",
      "apps/auth-api/docs/routes/health-check.md",
      "apps/auth-api/tsconfig.json",
      "apps/auth-api/vitest.config.ts",
      "apps/auth-api/src/routes/health-check.ts",
      "apps/auth-api/test/routes/health-check.test.ts",
    ]);
    expect(plan.changes[4]?.content).toContain("healthCheckRoute");
    expect(plan.changes[5]?.content).toContain("healthCheckResponseSchema");
    expect(plan.changes[1]?.content).toContain("Security, privacy, and operations");
  });

  it("creates missing manifest maps and a single-word symbol", () => {
    const plan = createRoutePlan(
      "platform-api",
      "health",
      '{"name":"@expressthat-auth/platform-api"}',
    );

    expect(plan.changes[4]?.content).toContain("healthRoute");
    expect(plan.summary).toBe("Created GET /health contract in @expressthat-auth/platform-api.");
  });

  it("rejects duplicate exports and invalid manifests", () => {
    const duplicate = JSON.stringify({
      exports: { "./routes/health": "./old.ts" },
      name: "@expressthat-auth/auth-api",
    });

    expect(() => createRoutePlan("auth-api", "health", duplicate)).toThrow("already exists");
    expect(() => createRoutePlan("auth-api", "health", "{")).toThrow();
    expect(() => createRoutePlan("auth-api", "health", '{"name":"other"}')).toThrow();
    expect(() =>
      createRoutePlan("auth-api", "health", '{"name":"@expressthat-auth/management-api"}'),
    ).toThrow("does not match");
  });
});
