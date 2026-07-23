import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";

const Identifier = z.object({
  id: z
    .string()
    .min(3)
    .openapi({
      example: "usr_123",
      param: { in: "path", name: "id" },
    }),
});

const Subject = z
  .object({
    id: z.string().openapi({ example: "usr_123" }),
    displayName: z.string().openapi({ example: "Ada Lovelace" }),
  })
  .openapi("ContractSpikeSubject");

const ValidationError = z
  .object({
    success: z.literal(false),
    error: z.object({
      name: z.string(),
      issues: z.array(z.unknown()),
    }),
  })
  .openapi("ContractSpikeValidationError");

const getSubject = createRoute({
  method: "get",
  path: "/v1/spike/{id}",
  operationId: "getContractSpikeSubject",
  summary: "Retrieve the contract-spike subject",
  tags: ["Contract spike"],
  request: { params: Identifier },
  responses: {
    200: {
      description: "The requested subject.",
      content: { "application/json": { schema: Subject } },
    },
    400: {
      description: "The path parameter failed validation.",
      content: { "application/json": { schema: ValidationError } },
    },
  },
});

export const app = new OpenAPIHono().openapi(getSubject, (context) => {
  const { id } = context.req.valid("param");

  return context.json({ id, displayName: "Ada Lovelace" }, 200);
});

app.doc("/openapi.json", {
  openapi: "3.1.0",
  info: {
    title: "Hono contract spike",
    version: "1.0.0",
  },
});

export type AppType = typeof app;
