FROM node:20-alpine AS base
RUN corepack enable

# ---- Prune the monorepo down to what "api" needs ----
FROM base AS pruner
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY . .
RUN npx turbo prune api --docker

# ---- Install deps and build ----
FROM base AS installer
WORKDIR /app
RUN apk add --no-cache libc6-compat

COPY --from=pruner /app/out/json/ .
RUN pnpm install --frozen-lockfile

COPY --from=pruner /app/out/full/ .
RUN pnpm turbo run build --filter=api...

# ---- Runtime image ----
FROM base AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 expressjs

COPY --from=installer --chown=expressjs:nodejs /app .

USER expressjs

ENV NODE_ENV=production
ARG PORT=5001
ENV PORT=${PORT}
EXPOSE ${PORT}

CMD ["node", "apps/api/dist/index.js"]
