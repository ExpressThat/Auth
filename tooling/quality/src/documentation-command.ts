import type { DocumentationViolation } from "./documentation-model.js";

export type DocumentationCommandDependencies = {
  findViolations: () => Promise<ReadonlyArray<DocumentationViolation>>;
  writeError: (message: string) => void;
  writeOutput: (message: string) => void;
};

export async function runDocumentationCommand(
  dependencies: DocumentationCommandDependencies,
): Promise<number> {
  const violations = await dependencies.findViolations();
  if (violations.length === 0) {
    dependencies.writeOutput("Documentation satisfies the repository policy.");
    return 0;
  }
  dependencies.writeError(
    [
      "Documentation policy violations:",
      ...violations.map((item) => `- ${item.path} [owner: ${item.owner}]: ${item.reason}`),
    ].join("\n"),
  );
  return 1;
}
