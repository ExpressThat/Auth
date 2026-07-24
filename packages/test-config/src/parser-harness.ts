export type ParserLimitCase = {
  expectation: "accept" | "reject";
  input: string;
  name: string;
};

export type ParserLimits = {
  maximumDepth: number;
  maximumBytes: number;
};

export function assertParserLimitCases(
  cases: ReadonlyArray<ParserLimitCase>,
  parse: (input: string) => unknown,
): void {
  for (const testCase of cases) {
    let rejected = false;
    try {
      parse(testCase.input);
    } catch {
      rejected = true;
    }

    if (testCase.expectation === "accept" && rejected) {
      throw new Error(`Parser rejected accepted boundary case: ${testCase.name}.`);
    }
    if (testCase.expectation === "reject" && !rejected) {
      throw new Error(`Parser accepted hostile boundary case: ${testCase.name}.`);
    }
  }
}

export function measureJsonDepth(input: string): number {
  let maximum = 0;
  let escaped = false;
  let quoted = false;
  const stack: string[] = [];

  for (const character of input) {
    if (quoted) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        quoted = false;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === "{" || character === "[") {
      stack.push(character);
      maximum = Math.max(maximum, stack.length);
    } else if (character === "}" || character === "]") {
      const opening = stack.pop();
      if (
        opening === undefined ||
        (character === "}" && opening !== "{") ||
        (character === "]" && opening !== "[")
      ) {
        return Number.POSITIVE_INFINITY;
      }
    }
  }

  return quoted || stack.length !== 0 ? Number.POSITIVE_INFINITY : maximum;
}

export function enforceJsonParserLimits(input: string, limits: ParserLimits): void {
  if (
    !Number.isSafeInteger(limits.maximumBytes) ||
    limits.maximumBytes < 1 ||
    !Number.isSafeInteger(limits.maximumDepth) ||
    limits.maximumDepth < 1
  ) {
    throw new RangeError("Parser limits must be positive safe integers.");
  }
  if (new TextEncoder().encode(input).byteLength > limits.maximumBytes) {
    throw new RangeError("Input exceeds the configured parser byte limit.");
  }
  if (measureJsonDepth(input) > limits.maximumDepth) {
    throw new RangeError("Input exceeds the configured parser depth.");
  }
}
