# `@expressthat-auth/api-client`

Auto-generated, type-safe TypeScript client for the ExpressThat Auth API, with **zero runtime dependencies**.

The client is generated from the OpenAPI spec produced by `packages/api` using
[swagger-typescript-api](https://github.com/acacode/swagger-typescript-api). The generated code
uses native `fetch` with no external runtime dependencies — everything needed is inlined into the
build output.

> **`src/generated/` is generated** – do not edit it manually. Run `pnpm build` to regenerate.

## Usage

```ts
import { createExpressThatAuthClient } from "@expressthat-auth/api-client";

const api = createExpressThatAuthClient("http://localhost:3001");

// People
const people = await api.people.listPeople();
const person = await api.people.getPersonById({ id: 1 });
await api.people.createPerson({ body: { name: "Alice", email: "alice@example.com" } });
await api.people.updatePerson({ id: 1, body: { name: "Alice Smith" } });
await api.people.deletePerson({ id: 1 });

// Todos
const todos = await api.todos.listTodos();
await api.todos.createTodo({ body: { title: "Buy milk", completed: false } });
await api.todos.updateTodo({ id: 1, body: { completed: true } });
await api.todos.deleteTodo({ id: 1 });
```

Use the `ExpressThatAuthClient` type for type annotations:

```ts
import { createExpressThatAuthClient, type ExpressThatAuthClient } from "@expressthat-auth/api-client";

let client: ExpressThatAuthClient;
client = createExpressThatAuthClient("http://localhost:3001");
```

## Authentication

Endpoints decorated with `[Authorize]` in the API are documented in the OpenAPI spec with a
Bearer security requirement. You can supply the JWT token at creation time or set it afterwards:

```ts
// Option 1 — pass token at creation
const api = createExpressThatAuthClient("http://localhost:3001", "your-jwt-token");

// Option 2 — set it later (e.g. after login)
const api = createExpressThatAuthClient("http://localhost:3001");
api.setSecurityData("your-jwt-token");

// Secured endpoints now automatically include: Authorization: Bearer your-jwt-token
const todos = await api.todos.listTodos();

// On logout, clear the token:
api.setSecurityData(null);
```

Unsecured endpoints are unaffected — the header is only added when `setSecurityData` has a
non-null value.

## Scripts

| Script                    | Description                                                                  |
| ------------------------- | ---------------------------------------------------------------------------- |
| `pnpm build`              | Generate `src/generated/` from the Release swagger, then bundle to `dist/`  |
| `pnpm dev`                | Watch the Debug swagger and regenerate `src/generated/` on every change      |
| `pnpm gen:client:release` | Generate client from `packages/api` Release build output                     |
| `pnpm gen:client:dev`     | Generate client from `packages/api` Debug build output                       |
| `pnpm check-types`        | TypeScript type-check (requires a prior `pnpm build`)                        |

## How it works

### `build`

1. `gen:client:release` – runs `swagger-typescript-api` pointing at
   `packages/api/bin/Release/net10.0/swagger.json`, which generates:
   - `src/generated/client.ts` – self-contained `Api` class with inline fetch client and all typed
     methods grouped by tag (controller)
2. `tsx scripts/build.ts` – cleans `dist/`, then:
   - **esbuild** bundles `src/index.ts` into `dist/index.js` (ESM) and `dist/index.cjs` (CJS) with
     sourcemaps
   - **tsc** emits `.d.ts` declaration files into `dist/`

### `dev`

Waits for the API server to be available, then uses `nodemon` to watch
`packages/api/bin/Debug/net10.0/swagger.json` and re-runs `gen:client:dev` on every change.
