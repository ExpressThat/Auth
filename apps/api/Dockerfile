# syntax=docker/dockerfile:1.7

# ── runtime base ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine AS base
WORKDIR /app
EXPOSE 3001

# ── build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS builder
WORKDIR /src

# Restore dependencies first (layer-cache friendly)
COPY apps/api/Api.csproj apps/api/
# If you have local C# packages in packages/, copy their .csproj files here too, e.g.:
#   COPY packages/my-lib/MyLib.csproj packages/my-lib/
RUN dotnet restore apps/api/Api.csproj

# Copy full source and publish
COPY apps/api/ apps/api/
# COPY packages/ packages/   ← uncomment when local C# packages are added
RUN dotnet publish apps/api/Api.csproj \
    --configuration Release \
    --no-restore \
    --output /app/publish

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
