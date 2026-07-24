export type HostileInput = {
  category: "encoding" | "injection" | "structure" | "transport";
  id: string;
  value: string;
};

export const HOSTILE_TEXT_CORPUS: ReadonlyArray<HostileInput> = Object.freeze([
  { category: "encoding", id: "nul", value: "alpha\u0000omega" },
  { category: "encoding", id: "bidi-override", value: "safe\u202Etxt" },
  { category: "encoding", id: "combining-mark", value: `e${"\u0301".repeat(32)}` },
  { category: "encoding", id: "lone-surrogate", value: "\uD800" },
  { category: "injection", id: "sql-control", value: "' OR 1=1 --" },
  {
    category: "injection",
    id: "template-expression",
    value: "$" + "{constructor.constructor()}",
  },
  {
    category: "injection",
    id: "html-script",
    value: "<script>" + "testOnly()" + "</script>",
  },
  { category: "structure", id: "path-traversal", value: "..\\..\\private" },
  { category: "structure", id: "prototype-key", value: "__proto__.polluted" },
  { category: "transport", id: "header-split", value: "safe\r\nX-Test-Injected: true" },
]);

export function createLimitCorpus(maximumLength: number, maximumDepth: number): HostileInput[] {
  if (!Number.isSafeInteger(maximumLength) || maximumLength < 1) {
    throw new RangeError("Maximum hostile-input length must be a positive safe integer.");
  }
  if (!Number.isSafeInteger(maximumDepth) || maximumDepth < 1) {
    throw new RangeError("Maximum hostile-input depth must be a positive safe integer.");
  }

  return [
    {
      category: "structure",
      id: "over-depth",
      value: `${"[".repeat(maximumDepth + 1)}0${"]".repeat(maximumDepth + 1)}`,
    },
    {
      category: "structure",
      id: "over-length",
      value: "x".repeat(maximumLength + 1),
    },
  ];
}
