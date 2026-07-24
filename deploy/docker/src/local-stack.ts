import { spawnSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

export const LOCAL_STACK_COMMANDS = ["down", "reset", "status", "up", "validate"] as const;

export type LocalStackCommand = (typeof LOCAL_STACK_COMMANDS)[number];

export interface LocalStackDependencies {
  readonly readCompose: () => Promise<string>;
  readonly readEnvironment: () => Readonly<Record<string, string | undefined>>;
  readonly run: (arguments_: readonly string[]) => {
    readonly error: Error | undefined;
    readonly status: number | null;
  };
}

const DEPLOYMENT_DIRECTORY = fileURLToPath(new URL("../", import.meta.url));
const COMPOSE_FILE = "compose.local.yaml";
const ENV_FILE = "local.compose.env";
const PROJECT_NAME = "expressthat-auth-local";
const EXPECTED_SERVICES = [
  "mailpit",
  "object-storage",
  "otel-collector",
  "rabbitmq",
  "valkey",
] as const;

const COMPOSE_PREFIX = [
  "compose",
  "--project-name",
  PROJECT_NAME,
  "--env-file",
  ENV_FILE,
  "--file",
  COMPOSE_FILE,
] as const;

export const defaultLocalStackDependencies: LocalStackDependencies = {
  readCompose: () => readFile(new URL("../compose.local.yaml", import.meta.url), "utf8"),
  // biome-ignore lint/style/noProcessEnv: This deployment boundary must reject production before Docker runs.
  readEnvironment: () => process.env,
  run: (arguments_) => {
    const result = spawnSync("docker", [...arguments_], {
      cwd: DEPLOYMENT_DIRECTORY,
      stdio: "inherit",
    });

    return { error: result.error, status: result.status };
  },
};

function isLocalStackCommand(candidate: string): candidate is LocalStackCommand {
  return (
    candidate === "down" ||
    candidate === "reset" ||
    candidate === "status" ||
    candidate === "up" ||
    candidate === "validate"
  );
}

export function parseLocalStackCommand(arguments_: readonly string[]): LocalStackCommand {
  const [candidate] = arguments_;

  if (arguments_.length !== 1 || candidate === undefined || !isLocalStackCommand(candidate)) {
    throw new TypeError(`Expected one local stack command: ${LOCAL_STACK_COMMANDS.join(", ")}.`);
  }

  return candidate;
}

export function assertLocalDeploymentEnvironment(
  environment: Readonly<Record<string, string | undefined>>,
): void {
  for (const name of ["APP_ENV", "DEPLOYMENT_ENV", "EXPRESSTHAT_ENV", "NODE_ENV"]) {
    const value = environment[name]?.trim().toLowerCase();

    if (value === "prod" || value === "production") {
      throw new Error(`The local dependency stack refuses production mode from ${name}.`);
    }
  }
}

export function findLocalComposeViolations(source: string): string[] {
  const violations: string[] = [];
  const imageLines = source.match(/^\s+image:\s+\S+$/gmu) ?? [];
  const publishedPorts = source.match(/^\s+-\s+"([^"]+)"$/gmu) ?? [];
  const healthChecks = source.match(/^\s+healthcheck:$/gmu) ?? [];

  for (const service of EXPECTED_SERVICES) {
    if (!source.includes(`  ${service}:\n`)) {
      violations.push(`missing required service ${service}`);
    }
  }

  if (imageLines.length !== EXPECTED_SERVICES.length) {
    violations.push("every required service must declare exactly one image");
  }

  for (const line of imageLines) {
    if (!/@sha256:[a-f0-9]{64}$/u.test(line)) {
      violations.push("every image must use an immutable sha256 manifest digest");
      break;
    }
  }

  for (const line of publishedPorts) {
    if (/^\s+-\s+"\d/u.test(line) && !line.includes('"127.0.0.1:')) {
      violations.push("every published port must bind to IPv4 loopback");
      break;
    }
  }

  if (healthChecks.length !== EXPECTED_SERVICES.length) {
    violations.push("every required service must declare a health check");
  }

  if (!source.includes("EXPRESSTHAT_LOCAL_STACK_ACK:?")) {
    violations.push("the explicit local-development acknowledgement is missing");
  }

  if (/^\s+privileged:\s+true$/mu.test(source)) {
    violations.push("privileged containers are prohibited");
  }

  if (/^\s+network_mode:\s+host$/mu.test(source)) {
    violations.push("host networking is prohibited");
  }

  return violations.sort();
}

export function localStackInvocations(command: LocalStackCommand): readonly (readonly string[])[] {
  const compose = (...arguments_: readonly string[]): readonly string[] => [
    ...COMPOSE_PREFIX,
    ...arguments_,
  ];

  switch (command) {
    case "down":
      return [compose("down", "--remove-orphans")];
    case "reset":
      return [
        compose("down", "--remove-orphans", "--volumes"),
        compose("up", "--detach", "--remove-orphans", "--wait"),
      ];
    case "status":
      return [compose("ps")];
    case "up":
      return [compose("up", "--detach", "--remove-orphans", "--wait")];
    case "validate":
      return [compose("config", "--quiet")];
  }
}

export async function executeLocalStack(
  arguments_: readonly string[],
  dependencies: LocalStackDependencies = defaultLocalStackDependencies,
): Promise<void> {
  const command = parseLocalStackCommand(arguments_);
  assertLocalDeploymentEnvironment(dependencies.readEnvironment());
  const violations = findLocalComposeViolations(await dependencies.readCompose());

  if (violations.length > 0) {
    throw new Error(`Unsafe local Compose configuration:\n- ${violations.join("\n- ")}`);
  }

  for (const invocation of localStackInvocations(command)) {
    const result = dependencies.run(invocation);

    if (result.error !== undefined) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Docker Compose command failed with status ${String(result.status)}.`);
    }
  }
}
