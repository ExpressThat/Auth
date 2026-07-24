import { readFile } from "node:fs/promises";
import { describe, expect, it, vi } from "vitest";
import {
  assertLocalDeploymentEnvironment,
  defaultLocalStackDependencies,
  executeLocalStack,
  findLocalComposeViolations,
  localStackInvocations,
  parseLocalStackCommand,
} from "../src/local-stack.js";

const VALID_COMPOSE = await readFile(new URL("../compose.local.yaml", import.meta.url), "utf8");

function dependencies(
  source = VALID_COMPOSE,
  results: Array<{ error?: Error; status: number | null }> = [{ status: 0 }],
) {
  return {
    readCompose: vi.fn().mockResolvedValue(source),
    readEnvironment: vi.fn(() => ({})),
    run: vi.fn(() => {
      const result = results.shift() ?? { status: 0 };

      return { error: result.error, status: result.status };
    }),
  };
}

describe("local stack policy", () => {
  it("accepts the checked-in stack", () => {
    expect(findLocalComposeViolations(VALID_COMPOSE)).toEqual([]);
  });

  it.each([
    [
      "missing service",
      VALID_COMPOSE.replace("  mailpit:\n", "  removed-mail:\n"),
      "missing required service mailpit",
    ],
    [
      "missing image",
      VALID_COMPOSE.replace(/^\s+image: axllent\/mailpit:.*\n/mu, ""),
      "every required service must declare exactly one image",
    ],
    [
      "floating image",
      VALID_COMPOSE.replace(/axllent\/mailpit:[^\s]+/u, "axllent/mailpit:v1.30.0"),
      "every image must use an immutable sha256 manifest digest",
    ],
    [
      "public port",
      VALID_COMPOSE.replace("127.0.0.1:8025:8025", "0.0.0.0:8025:8025"),
      "every published port must bind to IPv4 loopback",
    ],
    [
      "missing health check",
      VALID_COMPOSE.replace("    healthcheck:", "    removed-healthcheck:"),
      "every required service must declare a health check",
    ],
    [
      "missing acknowledgement",
      VALID_COMPOSE.replace("EXPRESSTHAT_LOCAL_STACK_ACK:?", "REMOVED_ACK:?"),
      "the explicit local-development acknowledgement is missing",
    ],
    [
      "privileged container",
      `${VALID_COMPOSE}\n    privileged: true\n`,
      "privileged containers are prohibited",
    ],
    [
      "host networking",
      `${VALID_COMPOSE}\n    network_mode: host\n`,
      "host networking is prohibited",
    ],
  ])("rejects %s", (_name, source, expected) => {
    expect(findLocalComposeViolations(source)).toContain(expected);
  });
});

describe("local stack commands", () => {
  it.each(["down", "reset", "status", "up", "validate"] as const)("parses %s", (command) => {
    expect(parseLocalStackCommand([command])).toBe(command);
  });

  it.each([[[]], [["up", "extra"]], [["production"]]] as const)(
    "rejects invalid arguments",
    (arguments_) => {
      expect(() => parseLocalStackCommand(arguments_)).toThrow("Expected one local stack command");
    },
  );

  it("accepts an explicitly local environment", () => {
    expect(() =>
      assertLocalDeploymentEnvironment({
        APP_ENV: " local ",
        DEPLOYMENT_ENV: undefined,
      }),
    ).not.toThrow();
  });

  it.each([
    ["APP_ENV", "production"],
    ["DEPLOYMENT_ENV", "prod"],
    ["EXPRESSTHAT_ENV", "PRODUCTION"],
    ["NODE_ENV", "Prod"],
  ])("refuses production mode from %s", (name, value) => {
    expect(() => assertLocalDeploymentEnvironment({ [name]: value })).toThrow(
      `refuses production mode from ${name}`,
    );
  });

  it("builds deterministic lifecycle invocations", () => {
    expect(localStackInvocations("down")[0]).toContain("--remove-orphans");
    expect(localStackInvocations("reset")).toHaveLength(2);
    expect(localStackInvocations("status")[0]?.at(-1)).toBe("ps");
    expect(localStackInvocations("up")[0]).toContain("--wait");
    expect(localStackInvocations("validate")[0]?.slice(-2)).toEqual(["config", "--quiet"]);
  });

  it("validates before executing and runs every reset step", async () => {
    const mocks = dependencies(VALID_COMPOSE, [{ status: 0 }, { status: 0 }]);

    await executeLocalStack(["reset"], mocks);

    expect(mocks.readCompose).toHaveBeenCalledOnce();
    expect(mocks.run).toHaveBeenCalledTimes(2);
  });

  it("rejects unsafe configuration before invoking Docker", async () => {
    const mocks = dependencies("services: {}");

    await expect(executeLocalStack(["up"], mocks)).rejects.toThrow(
      "Unsafe local Compose configuration",
    );
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("rejects production before reading configuration or invoking Docker", async () => {
    const mocks = dependencies();
    mocks.readEnvironment.mockReturnValue({ NODE_ENV: "production" });

    await expect(executeLocalStack(["up"], mocks)).rejects.toThrow("refuses production mode");
    expect(mocks.readCompose).not.toHaveBeenCalled();
    expect(mocks.run).not.toHaveBeenCalled();
  });

  it("propagates process startup errors", async () => {
    const failure = new Error("Docker unavailable");
    const mocks = dependencies(VALID_COMPOSE, [{ error: failure, status: null }]);

    await expect(executeLocalStack(["up"], mocks)).rejects.toBe(failure);
  });

  it("rejects unsuccessful process status", async () => {
    const mocks = dependencies(VALID_COMPOSE, [{ status: 17 }]);

    await expect(executeLocalStack(["up"], mocks)).rejects.toThrow("status 17");
  });

  it("provides real filesystem and process dependencies", async () => {
    await expect(defaultLocalStackDependencies.readCompose()).resolves.toContain("rabbitmq:");
    expect(defaultLocalStackDependencies.readEnvironment()).toBeDefined();
    const result = defaultLocalStackDependencies.run(["--version"]);

    expect(result.error).toBeUndefined();
    expect(result.status).toBe(0);
  });
});
