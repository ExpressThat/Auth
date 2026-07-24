import type { SyntheticSecret } from "./synthetic-secret.js";

export type RedactionOptions = {
  requireRedactionMarker?: boolean;
};

export function assertRedactedOutput(
  output: unknown,
  secrets: ReadonlyArray<SyntheticSecret>,
  options: RedactionOptions = {},
): string {
  let serialized: string | undefined;
  try {
    serialized = JSON.stringify(output);
  } catch {
    throw new Error("Diagnostic output must be safely serializable.");
  }
  if (serialized === undefined) {
    throw new Error("Diagnostic output must have a serialized representation.");
  }

  for (const secret of secrets) {
    if (serialized.includes(secret.revealForTest())) {
      throw new Error("Diagnostic output contains a synthetic secret value.");
    }
  }
  if ((options.requireRedactionMarker ?? true) && !serialized.includes("[REDACTED]")) {
    throw new Error("Diagnostic output does not contain an explicit redaction marker.");
  }
  return serialized;
}
