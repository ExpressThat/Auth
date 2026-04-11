# `api` – ExpressThat Auth API (App Wrapper)

This package is the deployable entry-point for the ExpressThat Auth API.
The actual API source lives in [`packages/api`](../../packages/api/README.md);
this wrapper holds:

- **Scripts** that forward `dev`, `build`, `check-types`, and `start` to the
  `packages/api` project.
- **`Dockerfile`** for containerised builds (built from the repo root).
- **`publish/`** output directory (gitignored) produced by `pnpm build`.

## Development

```sh
pnpm dev
# or from repo root: pnpm dev
```

The API starts at **http://localhost:3001** (override with the `PORT` env var).

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
