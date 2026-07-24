import type { ConfigurationIssue } from "./configuration-model.js";

export class StartupConfigurationError extends Error {
  public readonly code = "STARTUP_CONFIGURATION_INVALID";
  public readonly issues: readonly ConfigurationIssue[];

  public constructor(issues: readonly ConfigurationIssue[]) {
    super("Startup configuration is invalid.");
    this.name = "StartupConfigurationError";
    this.issues = issues;
  }

  public toJSON(): Readonly<{
    code: string;
    issues: readonly ConfigurationIssue[];
    message: string;
  }> {
    return {
      code: this.code,
      issues: this.issues,
      message: this.message,
    };
  }
}
