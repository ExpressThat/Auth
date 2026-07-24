export type DockerSecurityTarget = {
  fetch(request: Request): Promise<Response>;
  instance: "primary" | "secondary";
};

export type NormalizedSecurityResponse = {
  body: string;
  headers: Record<string, string>;
  status: number;
};

export type RuntimeSecurityCase = {
  assert?(response: NormalizedSecurityResponse, instance: DockerSecurityTarget["instance"]): void;
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

export async function runDockerReplicaSecurityCases(
  targets: readonly [DockerSecurityTarget, DockerSecurityTarget],
  cases: ReadonlyArray<RuntimeSecurityCase>,
): Promise<void> {
  if (targets[0].instance !== "primary" || targets[1].instance !== "secondary") {
    throw new Error("Docker security targets must use primary and secondary instance names.");
  }

  for (const testCase of cases) {
    const results: NormalizedSecurityResponse[] = [];
    for (const target of targets) {
      const normalized = await normalizeResponse(await target.fetch(testCase.request()));
      const selected = testCase.normalize?.(normalized) ?? normalized;
      testCase.assert?.(selected, target.instance);
      results.push(selected);
    }
    if (JSON.stringify(results[0]) !== JSON.stringify(results[1])) {
      throw new Error(`Docker replicas differ for security case: ${testCase.name}.`);
    }
  }
}
