FROM oven/bun:alpine AS builder

ARG DATABASE_URL
ARG REDIS_URL
ARG WORKER_CONCURRENCY

WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/worker/package.json ./apps/worker/
COPY tooling/typescript/package.json ./tooling/typescript/

# Packages
COPY packages/agents/package.json ./packages/agents/
COPY packages/cache/package.json ./packages/cache/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/logging/package.json ./packages/logging/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/queue/package.json ./packages/queue/
COPY packages/search/package.json ./packages/search/
COPY packages/utils/package.json ./packages/utils/
COPY packages/workflows/package.json ./packages/workflows/

# Libraries
COPY libraries/markdown/package.json ./libraries/markdown/
COPY libraries/content-analysis/package.json ./libraries/content-analysis/
COPY libraries/sdk/package.json ./libraries/sdk/

RUN bun install

COPY . .

# Build libraries
WORKDIR /app/libraries/markdown
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/content-analysis
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/sdk
RUN bun run build
WORKDIR /app

ENV NODE_ENV=production

RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/worker/src/index.ts

FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

CMD ["bun", "./dist/index.js"]
