FROM oven/bun:alpine AS builder

# Arcjet
ARG ARCJET_ENV
ARG ARCJET_KEY


# App
ARG APP_URL

# Logging
ARG LOG_LEVEL
ARG LOGTAIL_ENDPOINT
ARG LOGTAIL_SOURCE_TOKEN

# Better Auth
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS

# Database
ARG DATABASE_URL
ARG PG_VECTOR_URL

# AI/LLM
ARG OPENROUTER_API_KEY

# MinIO
ARG MINIO_ACCESS_KEY
ARG MINIO_BUCKET
ARG MINIO_ENDPOINT
ARG MINIO_SECRET_KEY

# PostHog
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ARG POSTHOG_PROJECT_ID
ARG POSTHOG_PERSONAL_API_KEY

# Redis
ARG REDIS_URL

# Resend
ARG RESEND_API_KEY

# Stripe
ARG STRIPE_LITE_PRICE_ID
ARG STRIPE_LITE_ANNUAL_PRICE_ID
ARG STRIPE_PRO_PRICE_ID
ARG STRIPE_PRO_ANNUAL_PRICE_ID
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET

# Search APIs
ARG TAVILY_API_KEYS
ARG EXA_API_KEYS
ARG FIRECRAWL_API_KEYS

# Worker
ARG WORKER_CONCURRENCY

WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/

# Packages
COPY packages/agents/package.json ./packages/agents/
COPY packages/api/package.json ./packages/api/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/cache/package.json ./packages/cache/
COPY packages/database/package.json ./packages/database/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/logging/package.json ./packages/logging/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/queue/package.json ./packages/queue/
COPY packages/search/package.json ./packages/search/
COPY packages/stripe/package.json ./packages/stripe/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/utils/package.json ./packages/utils/
COPY packages/workflows/package.json ./packages/workflows/

# Libraries (These must be built before server can be bundled)
COPY libraries/markdown/package.json ./libraries/markdown/
COPY libraries/content-analysis/package.json ./libraries/content-analysis/
COPY libraries/sdk/package.json ./libraries/sdk/


RUN bun install

COPY . .

ENV NODE_ENV=production

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

RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --external react-dom \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

FROM oven/bun:alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]
