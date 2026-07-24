import { describe, expect, it, vi } from "vitest";
import {
  runDualRuntimeSecurityCases,
  type SecurityRuntime,
} from "../src/runtime-security-harness.js";

function runtime(name: SecurityRuntime["name"], body = "denied"): SecurityRuntime {
  return {
    fetch: vi.fn(async (request: Request) => {
      expect(request.headers.get("x-test-case")).toBe("hostile");
      return new Response(body, {
        headers: {
          "cache-control": "no-store",
          "content-type": "application/problem+json",
          "x-internal-detail": "not-compared",
        },
        status: 403,
      });
    }),
    name,
  };
}

describe("Workers and Docker security runner", () => {
  it("runs fresh requests, assertions, and matching normalized responses", async () => {
    const workers = runtime("workers");
    const docker = runtime("docker");
    const assertResponse = vi.fn();

    await runDualRuntimeSecurityCases({ docker, workers }, [
      {
        assert: assertResponse,
        name: "tenant escape",
        request: () =>
          new Request("https://security.test/denied", {
            headers: { "x-test-case": "hostile" },
          }),
      },
    ]);

    expect(workers.fetch).toHaveBeenCalledOnce();
    expect(docker.fetch).toHaveBeenCalledOnce();
    expect(assertResponse).toHaveBeenCalledTimes(2);
    expect(assertResponse).toHaveBeenCalledWith(
      {
        body: "denied",
        headers: {
          "cache-control": "no-store",
          "content-type": "application/problem+json",
        },
        status: 403,
      },
      expect.any(String),
    );
  });

  it("supports explicit normalization of safe dynamic fields", async () => {
    await expect(
      runDualRuntimeSecurityCases(
        {
          docker: runtime("docker", "request-docker"),
          workers: runtime("workers", "request-worker"),
        },
        [
          {
            name: "dynamic request id",
            normalize: (response) => ({ ...response, body: "normalized" }),
            request: () =>
              new Request("https://security.test/denied", {
                headers: { "x-test-case": "hostile" },
              }),
          },
        ],
      ),
    ).resolves.toBeUndefined();
  });

  it("rejects target-name mistakes and observable runtime differences", async () => {
    await expect(
      runDualRuntimeSecurityCases({ docker: runtime("workers"), workers: runtime("workers") }, []),
    ).rejects.toThrow("matching target names");
    await expect(
      runDualRuntimeSecurityCases({ docker: runtime("docker"), workers: runtime("docker") }, []),
    ).rejects.toThrow("matching target names");
    await expect(
      runDualRuntimeSecurityCases(
        { docker: runtime("docker", "different"), workers: runtime("workers") },
        [
          {
            name: "different denial",
            request: () =>
              new Request("https://security.test/denied", {
                headers: { "x-test-case": "hostile" },
              }),
          },
        ],
      ),
    ).rejects.toThrow("differ for security case");
  });
});
