# Stage 1: Builder
FROM node:22-alpine AS builder

# Install Bun for fast dependency installation
RUN apk add --no-cache curl bash
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy root workspace config
COPY package.json bun.lock ./

# Copy all workspace source code (needed for workspace resolution)
COPY apps/ ./apps/
COPY packages/ ./packages/
COPY libraries/ ./libraries/
COPY tooling/ ./tooling/

# Install dependencies (workspace packages now resolvable)
RUN bun install --frozen-lockfile

# Build required libraries
RUN bun run build --filter=@libraries/markdown
RUN bun run build --filter=@libraries/content-analysis
RUN bun run build --filter=@libraries/sdk

# Build web app with client env vars
ENV NODE_ENV=production
ARG VITE_POSTHOG_HOST
ARG VITE_POSTHOG_KEY
RUN bun run build --filter=web

# Stage 2: Production Runner
FROM node:22-alpine AS runner

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
CMD ["node", ".output/server/index.mjs"]
