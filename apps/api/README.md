# `api` – ExpressThat Auth API

ASP.NET Core (.NET 9) Web API for the ExpressThat Auth platform.

## Development

Run the API in watch mode (rebuilds and restarts on file changes):

```sh
pnpm dev
# or directly: dotnet watch run --launch-profile Development
```

The API starts at **http://localhost:3001** (override with the `PORT` env var).

- `GET /api` → `Hello World!`
- `GET /api/name?name=<X>` → `Hello, <X>!`
- `GET /api/example?name=<X>` → demo of the `@expressthat-auth/example-lib` workspace package
- Swagger UI → **http://localhost:3001/api/docs**

## Build

```sh
pnpm build
# or directly: dotnet publish --configuration Release --output publish
```

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
    <TargetFramework>net9.0</TargetFramework>
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
