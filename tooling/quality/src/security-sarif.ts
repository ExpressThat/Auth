import { z } from "zod";
import type { SecurityFinding, SecuritySeverity } from "./security-model.js";

const locationSchema = z.object({
  physicalLocation: z.object({
    artifactLocation: z.object({ uri: z.string().min(1) }),
  }),
});

const resultSchema = z.object({
  level: z.enum(["error", "none", "note", "warning"]).optional(),
  locations: z.tuple([locationSchema]).rest(locationSchema),
  message: z.object({ text: z.string().min(1) }),
  properties: z.record(z.string(), z.unknown()).optional(),
  ruleId: z.string().min(1),
});

const sarifSchema = z.object({
  runs: z.array(
    z.object({
      results: z.array(resultSchema).optional(),
      tool: z.object({ driver: z.object({ name: z.string().min(1) }) }),
    }),
  ),
  version: z.literal("2.1.0"),
});

function scoreFrom(properties: Readonly<Record<string, unknown>> | undefined): number | undefined {
  const raw = properties?.["security-severity"];

  if (typeof raw !== "number" && typeof raw !== "string") {
    return undefined;
  }

  const score = Number(raw);
  return Number.isFinite(score) ? score : undefined;
}

function severityFor(
  level: "error" | "none" | "note" | "warning" | undefined,
  properties: Readonly<Record<string, unknown>> | undefined,
): SecuritySeverity {
  const score = scoreFrom(properties);

  if (score !== undefined) {
    if (score >= 9) return "critical";
    if (score >= 7) return "high";
    if (score >= 4) return "medium";
    if (score > 0) return "low";
  }

  if (level === "error") return "high";
  if (level === "warning") return "medium";
  if (level === "note") return "low";
  return "info";
}

export function decodeSarifFindings(source: string): SecurityFinding[] {
  // biome-ignore lint/plugin: The parsed value is immediately validated by the SARIF schema.
  const untrustedReport: unknown = JSON.parse(source);
  const sarif = sarifSchema.parse(untrustedReport);

  return sarif.runs
    .flatMap((run) =>
      (run.results ?? []).map((result) => ({
        message: result.message.text,
        path: result.locations[0].physicalLocation.artifactLocation.uri,
        ruleId: result.ruleId,
        severity: severityFor(result.level, result.properties),
        tool: run.tool.driver.name,
      })),
    )
    .sort(
      (left, right) =>
        left.tool.localeCompare(right.tool) ||
        left.path.localeCompare(right.path) ||
        left.ruleId.localeCompare(right.ruleId),
    );
}
