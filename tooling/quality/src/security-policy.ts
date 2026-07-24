import { z } from "zod";
import type {
  SecurityDecision,
  SecurityFinding,
  SecurityGate,
  SecuritySeverity,
  SecuritySuppression,
  SecuritySuppressionRegistry,
} from "./security-model.js";

const exactScope = z
  .string()
  .min(1)
  .refine((value) => !value.includes("*"), {
    message: "wildcards are prohibited",
  });

const suppressionSchema = z.object({
  compensatingControl: z.string().min(20),
  createdOn: z.iso.date(),
  expiresOn: z.iso.date(),
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{2,63}$/u),
  owner: z.string().min(3),
  path: exactScope,
  reason: z.string().min(20),
  ruleId: exactScope,
  tool: exactScope,
  trackingUrl: z.url(),
});

const registrySchema = z.object({
  suppressions: z.array(suppressionSchema),
  version: z.literal(1),
});

const BLOCKED_SEVERITIES: Readonly<Record<SecurityGate, ReadonlySet<SecuritySeverity>>> = {
  commit: new Set(["critical", "high"]),
  release: new Set(["critical", "high", "medium"]),
};

function dayNumber(value: string): number {
  return Date.parse(`${value}T00:00:00.000Z`) / 86_400_000;
}

export function decodeSecuritySuppressions(source: string): SecuritySuppressionRegistry {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the registry schema.
  const untrustedRegistry: unknown = JSON.parse(source);
  return registrySchema.parse(untrustedRegistry);
}

export function findSuppressionViolations(
  registry: SecuritySuppressionRegistry,
  today: string,
): string[] {
  const violations: string[] = [];
  const ids = new Set<string>();
  const scopes = new Set<string>();
  const currentDay = dayNumber(today);

  for (const suppression of registry.suppressions) {
    const createdDay = dayNumber(suppression.createdOn);
    const expiryDay = dayNumber(suppression.expiresOn);
    const scope = `${suppression.tool}\0${suppression.ruleId}\0${suppression.path}`;

    if (ids.has(suppression.id)) {
      violations.push(`duplicate suppression id ${suppression.id}`);
    }
    ids.add(suppression.id);

    if (scopes.has(scope)) {
      violations.push(`duplicate suppression scope ${suppression.tool}/${suppression.ruleId}`);
    }
    scopes.add(scope);

    if (expiryDay <= createdDay) {
      violations.push(`suppression ${suppression.id} must expire after creation`);
    } else if (expiryDay - createdDay > 90) {
      violations.push(`suppression ${suppression.id} exceeds the 90-day maximum`);
    }

    if (expiryDay < currentDay) {
      violations.push(`suppression ${suppression.id} expired on ${suppression.expiresOn}`);
    }
  }

  return violations.sort();
}

function matchingSuppression(
  finding: SecurityFinding,
  suppressions: readonly SecuritySuppression[],
): SecuritySuppression | undefined {
  return suppressions.find(
    (suppression) =>
      suppression.tool === finding.tool &&
      suppression.ruleId === finding.ruleId &&
      suppression.path === finding.path,
  );
}

export function evaluateSecurityFindings(
  findings: readonly SecurityFinding[],
  registry: SecuritySuppressionRegistry,
  gate: SecurityGate,
): SecurityDecision[] {
  return findings.map((finding) => {
    const suppression = matchingSuppression(finding, registry.suppressions);
    const inherentlyBlocked = BLOCKED_SEVERITIES[gate].has(finding.severity);
    const cannotSuppress = finding.severity === "critical" || finding.severity === "high";
    const blocked = inherentlyBlocked && (suppression === undefined || cannotSuppress);

    return suppression === undefined
      ? { ...finding, blocked }
      : { ...finding, blocked, suppressionId: suppression.id };
  });
}
