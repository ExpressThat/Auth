export type ReplicaStateCategory =
  | "authorization"
  | "job-ownership"
  | "locks"
  | "nonces"
  | "rate-limits"
  | "sessions"
  | "tenant-cache";

export const REPLICA_STATE_CATEGORIES: readonly ReplicaStateCategory[] = Object.freeze([
  "authorization",
  "job-ownership",
  "locks",
  "nonces",
  "rate-limits",
  "sessions",
  "tenant-cache",
]);
export type ReplicaIdentity = Readonly<{ instance: "primary" | "secondary" }>;

export type ReplicaStateProbeContext = Readonly<{
  primary: ReplicaIdentity;
  secondary: ReplicaIdentity;
  signal: AbortSignal;
}>;

export type ReplicaStateProbe = Readonly<{
  name: string;
  run(context: ReplicaStateProbeContext): Promise<boolean>;
}>;

export type ReplicaStateProbes = Readonly<Record<ReplicaStateCategory, ReplicaStateProbe>>;
export type ReplicaStateFailureCode = "probe-failed" | "probe-timeout";
export type ReplicaStateDefinitionCode =
  | "invalid-probe"
  | "invalid-timeout"
  | "missing-probe"
  | "unexpected-probe";

type ProbeResult = Readonly<{
  category: ReplicaStateCategory;
  status: "failed" | "passed" | "timed-out";
}>;

export class ReplicaStateDefinitionError extends Error {
  public readonly code: ReplicaStateDefinitionCode;

  public constructor(code: ReplicaStateDefinitionCode) {
    super(`Replica state suite definition failed (${code}).`);
    this.name = "ReplicaStateDefinitionError";
    this.code = code;
  }

  public toJSON(): Readonly<{ code: ReplicaStateDefinitionCode }> {
    return { code: this.code };
  }
}

export class ReplicaStateConformanceError extends Error {
  public readonly categories: readonly ReplicaStateCategory[];
  public readonly code: ReplicaStateFailureCode;

  public constructor(code: ReplicaStateFailureCode, categories: readonly ReplicaStateCategory[]) {
    super(`Replica state conformance failed (${code}).`);
    this.name = "ReplicaStateConformanceError";
    this.code = code;
    this.categories = Object.freeze([...categories]);
  }

  public toJSON(): Readonly<{
    categories: readonly ReplicaStateCategory[];
    code: ReplicaStateFailureCode;
  }> {
    return { categories: this.categories, code: this.code };
  }
}

export class ReplicaStateConformanceSuite {
  readonly #probes: ReadonlyArray<readonly [ReplicaStateCategory, ReplicaStateProbe]>;
  readonly #timeoutMilliseconds: number;

  private constructor(
    probes: ReadonlyArray<readonly [ReplicaStateCategory, ReplicaStateProbe]>,
    timeoutMilliseconds: number,
  ) {
    this.#probes = Object.freeze(probes);
    this.#timeoutMilliseconds = timeoutMilliseconds;
    Object.freeze(this);
  }

  public static define(
    probes: ReplicaStateProbes,
    timeoutMilliseconds: number,
  ): ReplicaStateConformanceSuite {
    validateTimeout(timeoutMilliseconds);
    return new ReplicaStateConformanceSuite(validateProbes(probes), timeoutMilliseconds);
  }

  public async run(): Promise<Readonly<{ passed: readonly ReplicaStateCategory[] }>> {
    const results = await Promise.all(
      this.#probes.map(async ([category, probe]) =>
        runProbe(category, probe, this.#timeoutMilliseconds),
      ),
    );
    const timedOut = categoriesWithStatus(results, "timed-out");
    if (timedOut.length > 0) {
      throw new ReplicaStateConformanceError("probe-timeout", timedOut);
    }
    const failed = categoriesWithStatus(results, "failed");
    if (failed.length > 0) {
      throw new ReplicaStateConformanceError("probe-failed", failed);
    }
    return Object.freeze({
      passed: Object.freeze(results.map((result) => result.category)),
    });
  }
}

function validateTimeout(milliseconds: number): void {
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1 || milliseconds > 60_000) {
    throw new ReplicaStateDefinitionError("invalid-timeout");
  }
}

function validateProbes(
  probes: ReplicaStateProbes,
): ReadonlyArray<readonly [ReplicaStateCategory, ReplicaStateProbe]> {
  const expected = new Set<string>(REPLICA_STATE_CATEGORIES);
  const entries = Object.entries(probes);
  if (entries.some(([category]) => !expected.has(category))) {
    throw new ReplicaStateDefinitionError("unexpected-probe");
  }
  if (entries.length !== expected.size) {
    throw new ReplicaStateDefinitionError("missing-probe");
  }
  return REPLICA_STATE_CATEGORIES.map((category) => {
    const probe = probes[category];
    if (
      probe === null ||
      typeof probe !== "object" ||
      !/^[a-z][a-z0-9 -]{0,119}$/u.test(probe.name) ||
      typeof probe.run !== "function"
    ) {
      throw new ReplicaStateDefinitionError("invalid-probe");
    }
    const entry: readonly [ReplicaStateCategory, ReplicaStateProbe] = Object.freeze([
      category,
      Object.freeze({ ...probe }),
    ]);
    return entry;
  });
}

async function runProbe(
  category: ReplicaStateCategory,
  probe: ReplicaStateProbe,
  timeoutMilliseconds: number,
): Promise<ProbeResult> {
  const controller = new AbortController();
  const timeout = Promise.withResolvers<"timed-out">();
  const timer = setTimeout(() => {
    controller.abort();
    timeout.resolve("timed-out");
  }, timeoutMilliseconds);
  const primary: ReplicaIdentity = Object.freeze({ instance: "primary" });
  const secondary: ReplicaIdentity = Object.freeze({ instance: "secondary" });
  const context: ReplicaStateProbeContext = Object.freeze({
    primary,
    secondary,
    signal: controller.signal,
  });
  try {
    const status = await Promise.race([
      probe
        .run(context)
        .then((passed) => (passed === true ? "passed" : "failed"))
        .catch((): ProbeResult["status"] => "failed"),
      timeout.promise,
    ]);
    return Object.freeze({ category, status });
  } finally {
    clearTimeout(timer);
  }
}

function categoriesWithStatus(
  results: readonly ProbeResult[],
  status: ProbeResult["status"],
): ReplicaStateCategory[] {
  return results.filter((result) => result.status === status).map((result) => result.category);
}
