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
RUN turbo prune web --docker

FROM base AS installer
COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile
COPY --from=pruner /app/out/full/ .
ENV DOCKER_BUILD=1
RUN --mount=type=secret,id=turbo_team,required=false \
	--mount=type=secret,id=turbo_token,required=false \
	sh -ec 'TURBO_ARGS=""; if [ -f /run/secrets/turbo_team ] && [ -f /run/secrets/turbo_token ]; then TURBO_ARGS="--team=$(cat /run/secrets/turbo_team) --token=$(cat /run/secrets/turbo_token)"; echo "Using Turborepo remote cache arguments"; fi; pnpm turbo run build --filter=web $TURBO_ARGS'

FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=installer --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
