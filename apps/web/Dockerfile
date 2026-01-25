# Stage 1: Builder
FROM oven/bun:1.2.8-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY bun.lock ./
COPY package.json ./
COPY apps/web/package.json ./apps/web/
COPY tooling/typescript/package.json ./tooling/typescript/

# Copy all package.json files
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

COPY libraries/markdown/package.json ./libraries/markdown/
COPY libraries/content-analysis/package.json ./libraries/content-analysis/
COPY libraries/spelling/package.json ./libraries/spelling/

# Install dependencies with frozen lockfile
RUN bun install 

# Copy all source code
COPY . .

# Build libraries in order
WORKDIR /app/libraries/markdown
RUN bun run build

WORKDIR /app/libraries/content-analysis
RUN bun run build

WORKDIR /app/libraries/spelling
RUN bun run build

# Build web app with Bun runtime
WORKDIR /app/apps/web

ARG NODE_ENV=production
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_KEY

ENV VITE_POSTHOG_HOST=$VITE_POSTHOG_HOST
ENV VITE_POSTHOG_KEY=$VITE_POSTHOG_KEY

# Use bun --bun flag for the build
RUN bun --bun vite build

# Stage 2: Production Runner
FROM oven/bun:1.2.8-alpine AS runner

WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/apps/web/.output ./.output

ARG PORT
ENV PORT=${PORT:-3000}
EXPOSE ${PORT}

ENV NODE_ENV=production

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://0.0.0.0:${PORT}/ || exit 1

CMD ["bun", "run", ".output/server/index.mjs"]
