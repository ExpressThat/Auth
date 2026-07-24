import type {
  AnyConfigurationDefinition,
  BindingValues,
  BuildValues,
  PublicValues,
  RedactedConfigurationSummary,
  SecretValues,
} from "./configuration-model.js";

export class ValidatedConfiguration<TDefinition extends AnyConfigurationDefinition> {
  readonly #bindings: BindingValues<TDefinition>;
  readonly #secrets: SecretValues<TDefinition>;
  public readonly buildValues: Readonly<BuildValues<TDefinition>>;
  public readonly publicValues: Readonly<PublicValues<TDefinition>>;

  public constructor(
    publicValues: PublicValues<TDefinition>,
    secretValues: SecretValues<TDefinition>,
    buildValues: BuildValues<TDefinition>,
    bindings: BindingValues<TDefinition>,
  ) {
    this.publicValues = Object.freeze(publicValues);
    this.buildValues = Object.freeze(buildValues);
    this.#secrets = secretValues;
    this.#bindings = bindings;
  }

  public binding<TKey extends keyof BindingValues<TDefinition>>(
    key: TKey,
  ): BindingValues<TDefinition>[TKey] {
    return this.#bindings[key];
  }

  public secret<TKey extends keyof SecretValues<TDefinition>>(
    key: TKey,
  ): SecretValues<TDefinition>[TKey] {
    return this.#secrets[key];
  }

  public toJSON(): RedactedConfigurationSummary {
    return {
      bindings: Object.keys(this.#bindings).sort(),
      build: this.buildValues,
      public: this.publicValues,
      secrets: Object.keys(this.#secrets).sort(),
    };
  }
}
