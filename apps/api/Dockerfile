# syntax=docker/dockerfile:1.7

# ── runtime base ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 3001

# ── build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder
WORKDIR /src

# Copy Api.csproj + all workspace C# packages via pnpm node_modules symlinks.
# Docker follows symlinks on COPY, so apps/api/node_modules/@expressthat-auth/
# brings in every workspace package automatically — no per-package COPY needed.
COPY apps/api/Api.csproj apps/api/
COPY apps/api/node_modules/@expressthat-auth/ apps/api/node_modules/@expressthat-auth/
RUN dotnet restore apps/api/Api.csproj

# Copy full API source and publish
COPY apps/api/ apps/api/
RUN dotnet publish apps/api/Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish \
    /p:GenerateSwaggerOnBuild=false

# ── final image ───────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app
ENV ASPNETCORE_ENVIRONMENT=Production
ENV PORT=3001

RUN addgroup --system --gid 1001 dotnet \
 && adduser  --system --uid 1001 --ingroup dotnet appuser

COPY --from=builder --chown=appuser:dotnet /app/publish .
USER appuser

ENTRYPOINT ["dotnet", "Api.dll"]
