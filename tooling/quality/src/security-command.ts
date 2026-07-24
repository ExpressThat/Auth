import type { SecurityGate } from "./security-model.js";
import {
  decodeSecuritySuppressions,
  evaluateSecurityFindings,
  findSuppressionViolations,
} from "./security-policy.js";
import { decodeSarifFindings } from "./security-sarif.js";

export interface SecurityCommandDependencies {
  readonly readText: (path: string) => Promise<string>;
  readonly today: () => string;
  readonly writeError: (message: string) => void;
  readonly writeOutput: (message: string) => void;
}

const SUPPRESSION_PATH = ".security/suppressions.json";

function parseGate(value: string | undefined): SecurityGate {
  if (value !== "commit" && value !== "release") {
    throw new TypeError("Security SARIF gate must be commit or release.");
  }
  return value;
}

export async function runSuppressionPolicyCommand(
  dependencies: SecurityCommandDependencies,
): Promise<number> {
  const registry = decodeSecuritySuppressions(await dependencies.readText(SUPPRESSION_PATH));
  const violations = findSuppressionViolations(registry, dependencies.today());

  if (violations.length > 0) {
    dependencies.writeError(`Security suppression violations:\n- ${violations.join("\n- ")}`);
    return 1;
  }

  dependencies.writeOutput("Security suppressions satisfy the expiry and scope policy.");
  return 0;
}

export async function runSarifPolicyCommand(
  arguments_: readonly string[],
  dependencies: SecurityCommandDependencies,
): Promise<number> {
  if (arguments_.length !== 2) {
    throw new TypeError("Expected a SARIF path and commit or release gate.");
  }

  const [path = "", gateValue] = arguments_;

  if (path.length === 0) {
    throw new TypeError("Expected a SARIF path.");
  }

  const gate = parseGate(gateValue);
  const registry = decodeSecuritySuppressions(await dependencies.readText(SUPPRESSION_PATH));
  const violations = findSuppressionViolations(registry, dependencies.today());

  if (violations.length > 0) {
    dependencies.writeError(`Security suppression violations:\n- ${violations.join("\n- ")}`);
    return 1;
  }

  const decisions = evaluateSecurityFindings(
    decodeSarifFindings(await dependencies.readText(path)),
    registry,
    gate,
  );
  const blocked = decisions.filter((decision) => decision.blocked);
  const report = {
    blocked: blocked.length,
    findings: decisions.map((decision) => ({
      blocked: decision.blocked,
      path: decision.path,
      ruleId: decision.ruleId,
      severity: decision.severity,
      suppressionId: decision.suppressionId ?? null,
      tool: decision.tool,
    })),
    gate,
    schemaVersion: 1,
    total: decisions.length,
  };

  dependencies.writeOutput(JSON.stringify(report));

  if (blocked.length > 0) {
    dependencies.writeError(
      [
        `Security ${gate} gate blocked ${String(blocked.length)} finding(s):`,
        ...blocked.map(
          (finding) => `- ${finding.tool}/${finding.ruleId} ${finding.severity} at ${finding.path}`,
        ),
      ].join("\n"),
    );
    return 1;
  }

  return 0;
}
