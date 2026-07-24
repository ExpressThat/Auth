import { describe, expect, it, vi } from "vitest";
import {
  type DockerSecurityTarget,
  runDockerReplicaSecurityCases,
} from "../src/runtime-security-harness.js";

function target(instance: DockerSecurityTarget["instance"], body = "denied"): DockerSecurityTarget {
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
    instance,
  };
}

describe("Docker replica security runner", () => {
  it("runs fresh requests, assertions, and matching normalized responses", async () => {
    const primary = target("primary");
    const secondary = target("secondary");
    const assertResponse = vi.fn();

    await runDockerReplicaSecurityCases(
      [primary, secondary],
      [
        {
          assert: assertResponse,
          name: "tenant escape",
          request: () =>
            new Request("https://security.test/denied", {
              headers: { "x-test-case": "hostile" },
            }),
        },
      ],
    );

    expect(primary.fetch).toHaveBeenCalledOnce();
    expect(secondary.fetch).toHaveBeenCalledOnce();
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
      runDockerReplicaSecurityCases(
        [target("primary", "request-one"), target("secondary", "request-two")],
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
      runDockerReplicaSecurityCases([target("secondary"), target("secondary")], []),
    ).rejects.toThrow("primary and secondary");
    await expect(
      runDockerReplicaSecurityCases([target("primary"), target("primary")], []),
    ).rejects.toThrow("primary and secondary");
    await expect(
      runDockerReplicaSecurityCases(
        [target("primary", "different"), target("secondary")],
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
