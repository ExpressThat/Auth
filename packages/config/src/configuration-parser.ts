import { z } from "zod";
import { StartupConfigurationError } from "./configuration-error.js";
import type {
  ConfigurationArea,
  ConfigurationDefinition,
  ConfigurationIssue,
  ConfigurationSection,
} from "./configuration-model.js";
import { ValidatedConfiguration } from "./validated-configuration.js";

const envelopeSchema = z.strictObject({
  bindings: z.unknown(),
  build: z.unknown(),
  public: z.unknown(),
  secrets: z.unknown(),
});

function safePath(path: readonly PropertyKey[]): string[] {
  return path.map((part) => (typeof part === "symbol" ? "[symbol]" : String(part)));
}

function issuesFor(area: ConfigurationArea, error: z.ZodError): ConfigurationIssue[] {
  return error.issues
    .map((issue) => ({
      area,
      code: issue.code,
      path: safePath(issue.path),
    }))
    .sort(
      (left, right) =>
        left.path.join(".").localeCompare(right.path.join(".")) ||
        left.code.localeCompare(right.code),
    );
}

function parseSection<TSchema extends z.ZodType<Record<string, unknown>>>(
  area: ConfigurationArea,
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new StartupConfigurationError(issuesFor(area, result.error));
  }
  return result.data;
}

export function defineConfiguration<
  TPublic extends z.ZodType<Record<string, unknown>>,
  TSecrets extends z.ZodType<Record<string, unknown>>,
  TBuild extends z.ZodType<Record<string, unknown>>,
  TBindings extends z.ZodType<Record<string, unknown>>,
>(
  definition: ConfigurationDefinition<TPublic, TSecrets, TBuild, TBindings>,
): Readonly<ConfigurationDefinition<TPublic, TSecrets, TBuild, TBindings>> {
  return Object.freeze(definition);
}

export function parseStartupConfiguration<
  TPublic extends ConfigurationSection,
  TSecrets extends ConfigurationSection,
  TBuild extends ConfigurationSection,
  TBindings extends ConfigurationSection,
>(
  definition: ConfigurationDefinition<TPublic, TSecrets, TBuild, TBindings>,
  input: unknown,
): ValidatedConfiguration<ConfigurationDefinition<TPublic, TSecrets, TBuild, TBindings>> {
  const envelope = envelopeSchema.safeParse(input);

  if (!envelope.success) {
    throw new StartupConfigurationError(issuesFor("envelope", envelope.error));
  }

  return new ValidatedConfiguration<ConfigurationDefinition<TPublic, TSecrets, TBuild, TBindings>>(
    parseSection("public", definition.public, envelope.data.public),
    parseSection("secrets", definition.secrets, envelope.data.secrets),
    parseSection("build", definition.build, envelope.data.build),
    parseSection("bindings", definition.bindings, envelope.data.bindings),
  );
}
