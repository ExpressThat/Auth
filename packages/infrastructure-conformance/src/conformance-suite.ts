import { requiredConformanceAxes } from "./capability-policy.js";
import { ConformanceDefinitionError, ConformanceExecutionError } from "./conformance-error.js";
import type {
  ConformanceCaseInput,
  ConformanceCaseResult,
  InfrastructureConformanceReport,
  InfrastructureConformanceSuiteInput,
} from "./conformance-model.js";

const CASE_NAME_PATTERN = /^[a-z][a-z0-9]*(?:[ -][a-z0-9]+)*$/u;

export class InfrastructureConformanceSuite {
  public readonly capability: InfrastructureConformanceSuiteInput["capability"];
  readonly #cases: readonly Readonly<ConformanceCaseInput>[];
  readonly #timeoutMilliseconds: number;

  private constructor(input: InfrastructureConformanceSuiteInput) {
    this.capability = input.capability;
    this.#cases = Object.freeze(input.cases.map((testCase) => Object.freeze({ ...testCase })));
    this.#timeoutMilliseconds = input.timeoutMilliseconds;
    Object.freeze(this);
  }

  public static define(input: InfrastructureConformanceSuiteInput): InfrastructureConformanceSuite {
    validateTimeout(input.timeoutMilliseconds);
    validateCases(input);
    return new InfrastructureConformanceSuite(input);
  }

  public async run(): Promise<InfrastructureConformanceReport> {
    const results: ConformanceCaseResult[] = [];
    for (const testCase of this.#cases) {
      await runCase(this.capability, testCase, this.#timeoutMilliseconds);
      results.push({ axis: testCase.axis, name: testCase.name, status: "passed" });
    }
    return Object.freeze({
      capability: this.capability,
      results: Object.freeze(results),
    });
  }

  public toJSON(): Readonly<{
    capability: InfrastructureConformanceSuiteInput["capability"];
    cases: number;
  }> {
    return { capability: this.capability, cases: this.#cases.length };
  }
}

function validateTimeout(milliseconds: number): void {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 60_000) {
    throw new ConformanceDefinitionError("invalid-timeout");
  }
}

function validateCases(input: InfrastructureConformanceSuiteInput): void {
  const required = new Set(requiredConformanceAxes(input.capability));
  const names = new Set<string>();
  const supplied = new Set<string>();
  for (const testCase of input.cases) {
    if (
      !required.has(testCase.axis) ||
      typeof testCase.run !== "function" ||
      testCase.name.length > 120 ||
      !CASE_NAME_PATTERN.test(testCase.name)
    ) {
      throw new ConformanceDefinitionError(
        required.has(testCase.axis) ? "invalid-case" : "unexpected-axis",
      );
    }
    if (names.has(testCase.name)) {
      throw new ConformanceDefinitionError("duplicate-case");
    }
    names.add(testCase.name);
    supplied.add(testCase.axis);
  }
  if ([...required].some((axis) => !supplied.has(axis))) {
    throw new ConformanceDefinitionError("missing-axis");
  }
}

async function runCase(
  capability: InfrastructureConformanceSuiteInput["capability"],
  testCase: Readonly<ConformanceCaseInput>,
  timeoutMilliseconds: number,
): Promise<void> {
  const controller = new AbortController();
  const timeout = Promise.withResolvers<never>();
  const timer = setTimeout(() => {
    controller.abort();
    timeout.reject(new ConformanceExecutionError("case-timeout", capability, testCase.axis));
  }, timeoutMilliseconds);

  try {
    await Promise.race([
      testCase.run({ signal: controller.signal }).catch(() => {
        throw new ConformanceExecutionError("case-failed", capability, testCase.axis);
      }),
      timeout.promise,
    ]);
  } finally {
    clearTimeout(timer);
  }
}
