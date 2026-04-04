# syntax=docker/dockerfile:1.7

FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable

FROM base AS pruner
RUN pnpm add -g turbo@^2
COPY . .
RUN turbo prune api --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
RUN --mount=type=secret,id=turbo_team,required=false \
	--mount=type=secret,id=turbo_token,required=false \
	sh -ec 'TURBO_ARGS=""; if [ -f /run/secrets/turbo_team ] && [ -f /run/secrets/turbo_token ]; then TURBO_ARGS="--team=$(cat /run/secrets/turbo_team) --token=$(cat /run/secrets/turbo_token)"; echo "Using Turborepo remote cache arguments"; fi; pnpm turbo run build --filter=api $TURBO_ARGS'

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3002
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs
COPY --from=installer /app/node_modules ./node_modules
COPY --from=installer /app/package.json ./package.json
COPY --from=installer /app/apps/api/package.json ./apps/api/package.json
COPY --from=installer /app/apps/api/dist ./apps/api/dist
USER nestjs
EXPOSE 3002
CMD ["node", "apps/api/dist/main.js"]
