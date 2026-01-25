# Stage 1: Builder
FROM oven/bun:alpine AS builder

WORKDIR /app

# Copy root workspace config
COPY bun.lock ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY tooling/typescript/package.json ./tooling/typescript/

# Packages
COPY packages/agents/package.json ./packages/agents/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/database/package.json ./packages/database/
COPY packages/editor/package.json ./packages/editor/
COPY packages/environment/package.json ./packages/environment/
COPY packages/files/package.json ./packages/files/
COPY packages/logging/package.json ./packages/logging/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/search/package.json ./packages/search/
COPY packages/stripe/package.json ./packages/stripe/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/ui/package.json ./packages/ui/
COPY packages/utils/package.json ./packages/utils/

# Libraries (These must be built before web can be bundled)
COPY libraries/markdown/package.json ./libraries/markdown/
COPY libraries/content-analysis/package.json ./libraries/content-analysis/
COPY libraries/sdk/package.json ./libraries/sdk/
COPY libraries/spelling/package.json ./libraries/spelling/

# Install dependencies (workspace packages now resolvable)
RUN bun install

# Copy all source code
COPY . .

# Build required libraries
WORKDIR /app/libraries/markdown
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/content-analysis
RUN bun run build
WORKDIR /app

WORKDIR /app/libraries/sdk
RUN bun run build
WORKDIR /app

# Build web app with client env vars
ARG NODE_ENV=production
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_KEY
ARG DATABASE_URL
ARG PG_VECTOR_URL
ARG REDIS_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_PRO_PRICE_ID
ARG STRIPE_PRO_ANNUAL_PRICE_ID
ARG STRIPE_LITE_PRICE_ID
ARG STRIPE_LITE_ANNUAL_PRICE_ID
ARG POSTHOG_HOST
ARG POSTHOG_KEY
ARG POSTHOG_PUBLIC_KEY
ARG POSTHOG_PROJECT_ID
ARG POSTHOG_PERSONAL_API_KEY
ARG RESEND_API_KEY
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG OPENROUTER_API_KEY
ARG TAVILY_API_KEYS
ARG EXA_API_KEYS
ARG FIRECRAWL_API_KEYS
ARG ARCJET_KEY
ARG ARCJET_ENV
ARG APP_URL
ARG SERVER_URL
ARG LOG_LEVEL
ARG LOGTAIL_ENDPOINT
ARG LOGTAIL_SOURCE_TOKEN
ARG WORKER_CONCURRENCY
ARG BETTER_STACK_HEARTBEAT_URL
RUN bun run --filter=web build

# Stage 2: Production Runner
FROM oven/bun:alpine AS runner

WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/apps/web/.output ./.output

# Set dynamic port with default
ARG PORT
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

# Set environment to production
ENV NODE_ENV=production

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:${PORT}/ || exit 1

# Start Nitro server (will read server env vars from environment)
CMD ["bun", "run", ".output/server/index.mjs"]
