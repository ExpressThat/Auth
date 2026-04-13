# `api` – ExpressThat Auth API

ASP.NET Core Web API (.NET 10) for the ExpressThat Auth service.

## Development

```sh
pnpm dev
```

The API starts at **http://localhost:3001** (override with the `PORT` env var).
Swagger UI is available at **http://localhost:3001/api/docs**.

## Build

```sh
pnpm build
```

Publishes the ASP.NET Core app to `apps/api/publish/`.

## Docker

```sh
# from repo root:
docker build -f apps/api/Dockerfile -t auth-api .
```

## Adding a C# dependency

1. Create the package under `packages/<name>/` with both a `.csproj` and a `package.json` (name: `@expressthat-auth/<name>`)
2. Add `"@expressthat-auth/<name>": "workspace:*"` to this package's `package.json` dependencies
3. Run `pnpm install` — pnpm creates a symlink into `node_modules/@expressthat-auth/`
4. MSBuild auto-discovers the `.csproj` via the glob `ProjectReference` in `Api.csproj`
5. In the `Dockerfile`, add a `COPY packages/<name>/<name>.csproj packages/<name>/` line before `dotnet restore`, a `COPY packages/<name>/ packages/<name>/` line before `dotnet publish`. The `apps/api/node_modules/@expressthat-auth/` directory is already included via the `.dockerignore` exception and copied in the build stage — MSBuild will discover the new `.csproj` automatically (no extra steps needed)
