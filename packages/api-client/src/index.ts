import createClient from "openapi-fetch";
import type { paths } from "./schema.gen.js";

export type { paths };
export { createClient };

/**
 * Creates a type-safe fetch client for the ExpressThat Auth API.
 *
 * @example
 * ```ts
 * import { createApiClient } from "@expressthat-auth/api-client";
 *
 * const api = createApiClient("http://localhost:3001");
 * const { data } = await api.GET("/api");
 * ```
 */
export function createApiClient(baseUrl: string) {
  return createClient<paths>({ baseUrl });
}
