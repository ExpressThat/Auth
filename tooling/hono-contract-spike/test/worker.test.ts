import { exports } from "cloudflare:workers";
import { describe, expect, it } from "vitest";

describe("Workers runtime", () => {
  it("executes the Hono contract in workerd", async () => {
    const response = await exports.default.fetch(
      new Request("https://auth.test/v1/spike/usr_worker"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: "usr_worker",
      displayName: "Ada Lovelace",
    });
  });
});
