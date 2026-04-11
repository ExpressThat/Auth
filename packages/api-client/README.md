# `@expressthat-auth/api-client`

Auto-generated, type-safe TypeScript client for the ExpressThat Auth API.

Types are generated from the OpenAPI spec produced by `packages/api` using
[openapi-typescript](https://github.com/openapi-ts/openapi-typescript) and
served via [openapi-fetch](https://github.com/openapi-ts/openapi-typescript/tree/main/packages/openapi-fetch).

> **`src/schema.gen.ts` is generated** – do not edit it manually.  Run
> `pnpm build` to regenerate.

## Usage

```ts
import { createApiClient } from "@expressthat-auth/api-client";

const api = createApiClient("http://localhost:3001");

const { data, error } = await api.GET("/api/name", {
  params: { query: { name: "World" } },
});
```

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm build` | Generate `swagger.json` from `packages/api`, then generate `src/schema.gen.ts` |
| `pnpm dev` | Watch all C# files in `packages/` and rebuild + regenerate on every change |
| `pnpm gen:spec` | Build `packages/api` and emit `packages/api/swagger.json` |
| `pnpm gen:types` | Convert `packages/api/swagger.json` → `src/schema.gen.ts` |
| `pnpm check-types` | TypeScript type-check (requires a prior `pnpm build`) |

## How it works

### `build`

1. `gen:spec` – runs `pnpm --filter @expressthat-auth/api gen:spec` which:
   - Restores the Swashbuckle CLI dotnet tool (`dotnet tool restore`)
   - Compiles `packages/api` (`dotnet build --configuration Release`)
   - Runs `dotnet swagger tofile` to produce `packages/api/swagger.json`
2. `gen:types` – runs `openapi-typescript ../api/swagger.json -o src/schema.gen.ts`

### `dev`

Runs `scripts/dev.ts` via `tsx`.  The script:

1. Performs an initial `pnpm build`.
2. Watches all `*.cs` and `*.csproj` files under `packages/` (covering
   `packages/api` and any workspace packages it depends on) using
   [chokidar](https://github.com/paulmillr/chokidar).
3. On any change, triggers a fresh `pnpm build` (debounced – in-flight builds
   are coalesced into a single follow-up run).
