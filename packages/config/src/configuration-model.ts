import type { z } from "zod";

export type ConfigurationArea = "bindings" | "build" | "envelope" | "public" | "secrets";

export type ConfigurationSection = z.ZodType<Record<string, unknown>>;

export interface ConfigurationDefinition<
  TPublic extends ConfigurationSection = ConfigurationSection,
  TSecrets extends ConfigurationSection = ConfigurationSection,
  TBuild extends ConfigurationSection = ConfigurationSection,
  TBindings extends ConfigurationSection = ConfigurationSection,
> {
  readonly bindings: TBindings;
  readonly build: TBuild;
  readonly public: TPublic;
  readonly secrets: TSecrets;
}

export type AnyConfigurationDefinition = ConfigurationDefinition<
  ConfigurationSection,
  ConfigurationSection,
  ConfigurationSection,
  ConfigurationSection
>;

export type PublicValues<TDefinition extends AnyConfigurationDefinition> = z.output<
  TDefinition["public"]
>;
export type SecretValues<TDefinition extends AnyConfigurationDefinition> = z.output<
  TDefinition["secrets"]
>;
export type BuildValues<TDefinition extends AnyConfigurationDefinition> = z.output<
  TDefinition["build"]
>;
export type BindingValues<TDefinition extends AnyConfigurationDefinition> = z.output<
  TDefinition["bindings"]
>;

export interface ConfigurationIssue {
  readonly area: ConfigurationArea;
  readonly code: string;
  readonly path: readonly string[];
}

export interface RedactedConfigurationSummary {
  readonly bindings: readonly string[];
  readonly build: Readonly<Record<string, unknown>>;
  readonly public: Readonly<Record<string, unknown>>;
  readonly secrets: readonly string[];
}
