export type SecurityRuntime = {
  fetch(request: Request): Promise<Response>;
  name: "docker" | "workers";
};

export type NormalizedSecurityResponse = {
  body: string;
  headers: Record<string, string>;
  status: number;
};

export type RuntimeSecurityCase = {
  assert?(response: NormalizedSecurityResponse, runtime: SecurityRuntime["name"]): void;
  name: string;
  normalize?(response: NormalizedSecurityResponse): NormalizedSecurityResponse;
  request(): Request;
};

const SECURITY_HEADERS: ReadonlyArray<string> = [
  "cache-control",
  "content-type",
  "location",
  "set-cookie",
  "www-authenticate",
];

async function normalizeResponse(response: Response): Promise<NormalizedSecurityResponse> {
  const headers: Record<string, string> = {};
  for (const name of SECURITY_HEADERS) {
    const value = response.headers.get(name);
    if (value !== null) {
      headers[name] = value;
    }
  }
  return {
    body: await response.text(),
    headers,
    status: response.status,
  };
}

export async function runDualRuntimeSecurityCases(
  runtimes: { docker: SecurityRuntime; workers: SecurityRuntime },
  cases: ReadonlyArray<RuntimeSecurityCase>,
): Promise<void> {
  if (runtimes.docker.name !== "docker" || runtimes.workers.name !== "workers") {
    throw new Error("Security runtimes must use their matching target names.");
  }

  for (const testCase of cases) {
    const results: NormalizedSecurityResponse[] = [];
    for (const runtime of [runtimes.workers, runtimes.docker]) {
      const normalized = await normalizeResponse(await runtime.fetch(testCase.request()));
      const selected = testCase.normalize?.(normalized) ?? normalized;
      testCase.assert?.(selected, runtime.name);
      results.push(selected);
    }
    if (JSON.stringify(results[0]) !== JSON.stringify(results[1])) {
      throw new Error(`Workers and Docker differ for security case: ${testCase.name}.`);
    }
  }
}
