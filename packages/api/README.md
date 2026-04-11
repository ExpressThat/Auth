# `@expressthat-auth/api` – ExpressThat Auth API

ASP.NET Core (.NET 10) Web API for the ExpressThat Auth platform.

This package lives in `packages/api/` and is consumed by `apps/api/` as a
pnpm workspace dependency.  The `apps/api/` wrapper is the entry-point used
for development, deployment, and the Dockerfile; this package provides the
reusable API source that `packages/api-client` uses to generate typed clients.

## Development

Run the API in watch mode via the `apps/api` wrapper:

```sh
# from repo root
pnpm dev
# or from apps/api:
pnpm dev
```

The API starts at **http://localhost:3001** (override with the `PORT` env var).

- `GET /api` → `Hello World!`
- `GET /api/name?name=<X>` → `Hello, <X>!`
- `GET /api/example?name=<X>` → demo of the `@expressthat-auth/example-lib` workspace package
- Swagger UI → **http://localhost:3001/api/docs**

## Build

```sh
pnpm build
# or directly: dotnet build --configuration Release
```

## OpenAPI spec generation

Swagger generation is wired into the API project build target, so every build
and every `dotnet watch` rebuild emits `swagger.json` alongside the package.
`gen:spec` is now a convenience alias to `build`.

```sh
pnpm tools:restore
pnpm gen:spec
# or directly:
dotnet tool restore
dotnet build --configuration Release
```

`pnpm build`/`pnpm gen:spec` does not perform tool restore, so restore tools at
least once with `pnpm tools:restore`.

`packages/api-client` calls this script automatically when generating the
TypeScript client.

## C# workspace packages

C# class libraries can live in `packages/<name>/` alongside JavaScript packages.
A C# package just needs:

1. A `package.json` with a scoped name and dotnet scripts:

```json
{
  "name": "@expressthat-auth/<name>",
  "scripts": { "build": "dotnet build --configuration Release" }
}
```

2. A `.csproj` (class library):

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net10.0</TargetFramework>
  </PropertyGroup>
</Project>
```

3. C# source files.

### Consuming a package

Add it to the API's `package.json` `dependencies` (using the pnpm workspace protocol):

```json
{
  "dependencies": {
    "@expressthat-auth/my-lib": "workspace:*"
  }
}
```

Run `pnpm install` – pnpm will symlink the package into
`node_modules/@expressthat-auth/my-lib`.  The API's `Api.csproj` contains a
wildcard `ProjectReference` that automatically discovers any `.csproj` under
`node_modules/@expressthat-auth/`, so **no manual project-file edits are
needed**.

Turbo's `^build` dependency ordering ensures the library is always built before
the API, and turbo caching keeps subsequent builds fast.

See `packages/example-lib/` for a working example.
