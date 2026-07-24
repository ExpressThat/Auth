import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  defaultGeneratorCommandDependencies,
  type GeneratorCommandDependencies,
  runGeneratorCommand,
} from "../src/generator-command.js";

const temporaryDirectories: string[] = [];

afterEach(async () => {
  for (const path of temporaryDirectories.splice(0)) {
    await rm(path, { force: true, recursive: true });
  }
});

function dependencies(
  overrides: Partial<GeneratorCommandDependencies> = {},
): GeneratorCommandDependencies {
  return {
    apply: vi.fn(async () => undefined),
    read: vi.fn(async () => '{"name":"@expressthat-auth/auth-api"}'),
    stderr: { write: vi.fn() },
    stdout: { write: vi.fn() },
    ...overrides,
  };
}

describe("generator command", () => {
  it("applies a workspace plan and reports its summary", async () => {
    const command = dependencies();

    await expect(
      runGeneratorCommand(
        "repository",
        ["workspace", "--kind", "library", "--name", "audit-core", "--description", "Audit."],
        command,
      ),
    ).resolves.toBe(0);
    expect(command.read).not.toHaveBeenCalled();
    expect(command.apply).toHaveBeenCalledWith(
      "repository",
      expect.objectContaining({
        summary: "Created library workspace @expressthat-auth/audit-core.",
      }),
    );
    expect(command.stdout.write).toHaveBeenCalledWith(
      "Created library workspace @expressthat-auth/audit-core.\n",
    );
  });

  it("reads an application manifest and applies a route plan", async () => {
    const command = dependencies();

    await expect(
      runGeneratorCommand(
        "repository",
        ["route", "--app", "auth-api", "--name", "health"],
        command,
      ),
    ).resolves.toBe(0);
    expect(command.read).toHaveBeenCalledWith("repository/apps/auth-api/package.json");
    expect(command.apply).toHaveBeenCalledWith(
      "repository",
      expect.objectContaining({ summary: expect.stringContaining("GET /health") }),
    );
  });

  it.each([
    [new Error("write failed"), "write failed\n"],
    ["failure", "Unknown generator failure.\n"],
  ])("reports generation failures", async (failure, expected) => {
    const command = dependencies({
      apply: vi.fn(async () => Promise.reject(failure)),
    });

    await expect(
      runGeneratorCommand(
        "repository",
        ["workspace", "--kind", "library", "--name", "audit-core", "--description", "Audit."],
        command,
      ),
    ).resolves.toBe(1);
    expect(command.stderr.write).toHaveBeenCalledWith(expected);
  });

  it("provides real filesystem-backed command dependencies", async () => {
    const root = await mkdtemp(join(tmpdir(), "expressthat-auth-command-"));
    temporaryDirectories.push(root);
    const manifest = join(root, "package.json");
    await writeFile(manifest, '{"name":"example"}', "utf8");
    const command = defaultGeneratorCommandDependencies();

    await expect(command.read(manifest)).resolves.toBe('{"name":"example"}');
    expect(command.apply).toBeTypeOf("function");
    expect(command.stderr).toBe(process.stderr);
    expect(command.stdout).toBe(process.stdout);
  });

  it("generates a documented application and route through the real composition", async () => {
    const root = await mkdtemp(join(tmpdir(), "expressthat-auth-integration-"));
    temporaryDirectories.push(root);
    const actual = defaultGeneratorCommandDependencies();
    const command: GeneratorCommandDependencies = {
      ...actual,
      stderr: { write: vi.fn() },
      stdout: { write: vi.fn() },
    };

    await expect(
      runGeneratorCommand(
        root,
        [
          "workspace",
          "--kind",
          "application",
          "--name",
          "example-api",
          "--description",
          "Example.",
        ],
        command,
      ),
    ).resolves.toBe(0);
    await expect(
      runGeneratorCommand(
        root,
        ["route", "--app", "example-api", "--name", "health-check"],
        command,
      ),
    ).resolves.toBe(0);

    await expect(readFile(join(root, "apps/example-api/README.md"), "utf8")).resolves.toContain(
      "Security and privacy",
    );
    await expect(
      readFile(join(root, "apps/example-api/docs/routes/health-check.md"), "utf8"),
    ).resolves.toContain("Access and tenant scope");
    await expect(
      readFile(join(root, "apps/example-api/src/routes/health-check.ts"), "utf8"),
    ).resolves.toContain("healthCheckRoute");
  });
});
