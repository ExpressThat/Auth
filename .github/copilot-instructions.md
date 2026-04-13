# Copilot Instructions

## Architecture

Turborepo monorepo with a mixed TypeScript/C# stack:

- **`apps/web`** – Vite + React + TypeScript frontend
- **`apps/api`** – ASP.NET Core Web API (.NET 10); the full API source, entry-point for running and deploying
- **`packages/api-client`** – auto-generated TypeScript client (swagger-typescript-api); generated from the swagger.json produced when `apps/api` is built
- **`packages/eslint-config`** / **`packages/typescript-config`** – shared lint/TS configs

The web app and API are deployed independently. The web app calls the API via `@expressthat-auth/api-client`.

## Commands

```sh
pnpm install          # install all dependencies
pnpm dev              # start all apps in watch mode
pnpm build            # full production build
pnpm check-types      # type-check across all packages
pnpm format-and-lint        # check formatting (Biome)
pnpm format-and-lint:fix    # auto-fix formatting
```

Run a single package script:
```sh
pnpm --filter <package-name> <script>
# e.g. pnpm --filter @expressthat-auth/api-client check-types
# e.g. pnpm --filter web dev
```

**Always run after completing tasks:**
```sh
pnpm check-types && pnpm format-and-lint:fix
```

## Key Conventions

### After Modifying C# API

Changing controllers or models requires regenerating the TypeScript client:
```sh
pnpm --filter api build          # builds API and produces swagger.json
pnpm --filter @expressthat-auth/api-client gen:client:release   # regenerates src/generated/Api.ts
```

Both `apps/api/swagger.json` and `packages/api-client/src/generated/Api.ts` are gitignored and must be generated locally.

### API Client Usage

The generated client is namespaced by controller (moduleNameIndex: 1):
```ts
import { createExpressThatAuthClient } from "@expressthat-auth/api-client";
const client = createExpressThatAuthClient("http://localhost:3001", token);
client.people.listPeople();
client.todos.createTodo({ title: "...", completed: false });
```

### ASP.NET Controller Conventions

- Routes follow `[Route("api/[controller]")]`
- The OpenAPI `operationId` comes directly from the action method name (set via `CustomOperationIds` in `Program.cs`) — name actions descriptively: `ListPeople`, `GetPersonById`, `CreatePerson`
- Apply `[Authorize]` to individual actions or the whole controller; `AuthorizeOperationFilter` automatically strips the Bearer requirement from non-`[Authorize]` endpoints in Swagger UI
- Swagger UI is served at `/api/docs`; swagger.json at `/api/swagger/v1/swagger.json`

### Adding a C# Package

1. Create the package under `packages/<name>/` with both a `.csproj` and a `package.json` (name: `@expressthat-auth/<name>`)
2. Add `"@expressthat-auth/<name>": "workspace:*"` to the consuming package's `package.json` dependencies
3. Run `pnpm install` — pnpm creates a symlink into `node_modules/@expressthat-auth/`
4. MSBuild auto-discovers the `.csproj` via the glob `ProjectReference` in `Api.csproj` — no manual reference needed

`Directory.Build.props` sets `ProduceReferenceAssembly=false` repo-wide; do not remove this as it prevents build-state conflicts when packages are built both standalone and as `ProjectReference`s.

### Formatting

Biome handles formatting (not ESLint). Config in `biome.json`: 2-space indent, 100-char line width, double quotes. C# files are excluded from Biome.
