import { executeLocalStack } from "./local-stack.js";

try {
  await executeLocalStack(process.argv.slice(2));
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown local stack failure.";
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
}
