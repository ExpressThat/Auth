# syntax=docker/dockerfile:1.7

FROM node:24-alpine AS base
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
RUN --mount=type=secret,id=turbo_team,required=false \
    --mount=type=secret,id=turbo_token,required=false \
    sh -ec 'TURBO_ARGS=""; if [ -f /run/secrets/turbo_team ] && [ -f /run/secrets/turbo_token ]; then TURBO_ARGS="--team=$(cat /run/secrets/turbo_team) --token=$(cat /run/secrets/turbo_token)"; echo "Using Turborepo remote cache"; fi; pnpm turbo run build --filter=web $TURBO_ARGS'

FROM nginx:alpine AS runner
COPY --from=installer /app/apps/web/dist /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
