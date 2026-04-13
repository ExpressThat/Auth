# syntax=docker/dockerfile:1.7

# ── runtime base ─────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/aspnet:10.0-alpine AS base
WORKDIR /app
EXPOSE 3001

# ── build stage ───────────────────────────────────────────────────────────────
FROM mcr.microsoft.com/dotnet/sdk:10.0-alpine AS builder
WORKDIR /src

# Copy project files first for layer-cache-friendly restore.
# Add a COPY line for each C# workspace package you add to apps/api package.json dependencies:
COPY apps/api/Api.csproj apps/api/
COPY packages/example-lib/ExampleLib.csproj packages/example-lib/
RUN dotnet restore apps/api/Api.csproj

# Copy source and publish
COPY apps/api/ apps/api/
COPY packages/example-lib/ packages/example-lib/
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
