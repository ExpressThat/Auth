import { serve } from "@hono/node-server";
import { hc } from "hono/client";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, expectTypeOf, it } from "vitest";
import { app, type AppType } from "../src/app.ts";

const servers: Array<ReturnType<typeof serve>> = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

describe("Hono contract", () => {
  it("generates a complete OpenAPI operation", async () => {
    const response = await app.request("/openapi.json");
    const document = await response.json();
    const operation = document.paths?.["/v1/spike/{id}"]?.get;

    expect(response.status).toBe(200);
    expect(document.openapi).toBe("3.1.0");
    expect(operation?.operationId).toBe("getContractSpikeSubject");
    expect(operation?.parameters?.[0]?.schema?.minLength).toBe(3);
    expect(operation?.responses).toHaveProperty("200");
    expect(operation?.responses).toHaveProperty("400");
    expect(document.components?.schemas).toHaveProperty("ContractSpikeSubject");
  });

  it("serves the same app through the Node HTTP adapter", async () => {
    const server = serve({ fetch: app.fetch, port: 0 });
    servers.push(server);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const { port } = server.address() as AddressInfo;

    const response = await fetch(`http://127.0.0.1:${port}/v1/spike/usr_123`);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "usr_123",
      displayName: "Ada Lovelace",
    });
  });

  it("provides an inferred, callable client contract", async () => {
    const localFetch: typeof fetch = (input, init) => {
      const request = input instanceof Request ? input : new Request(input, init);

      return Promise.resolve(app.fetch(request));
    };
    const client = hc<AppType>("https://auth.test", {
      fetch: localFetch,
    });
    const response = await client.v1.spike[":id"].$get({
      param: { id: "usr_456" },
    });

    if (response.status !== 200) {
      throw new Error(`Unexpected typed-client status: ${response.status}`);
    }

    const body = await response.json();

    expectTypeOf(body).toEqualTypeOf<{
      id: string;
      displayName: string;
    }>();
    expect(body.id).toBe("usr_456");
  });

  it("rejects an invalid path parameter", async () => {
    const response = await app.request("/v1/spike/x");

    expect(response.status).toBe(400);
  });
});
