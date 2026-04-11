# `@expressthat-auth/example-lib`

An example C# class library workspace package.

## Creating a C# workspace package

1. Create a folder under `packages/<name>/`
2. Add a `package.json` with a scoped name and dotnet scripts:

```json
{
  "name": "@expressthat-auth/<name>",
  "version": "0.0.1",
  "private": true,
  "scripts": {
    "build": "dotnet build --configuration Release",
    "check-types": "dotnet build"
  }
}
```

3. Add a `.csproj` (class library):

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net9.0</TargetFramework>
  </PropertyGroup>
</Project>
```

4. Add your C# source files.

## Consuming a C# workspace package from the API

In `apps/api/package.json`, add the package to `dependencies`:

```json
{
  "dependencies": {
    "@expressthat-auth/example-lib": "workspace:*"
  }
}
```

Run `pnpm install` – pnpm will symlink the package into
`node_modules/@expressthat-auth/example-lib`.

The API's `Api.csproj` contains a glob `ProjectReference` that automatically
discovers any `.csproj` files under `node_modules/@expressthat-auth/`, so no
manual project-reference edits are needed.

Turbo's `^build` dependency ensures the library is always built before the API.
