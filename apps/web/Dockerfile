# Stage 1: Builder
FROM node:22-alpine AS builder

# Install Bun for fast dependency installation
RUN apk add --no-cache curl bash
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:${PATH}"

WORKDIR /app

# Copy workspace files
COPY package.json bun.lock ./
COPY apps/web/package.json apps/web/
COPY libraries/*/package.json libraries/*/
COPY packages/*/package.json packages/*/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY . .

# Build required libraries
RUN bun run build --filter=@libraries/markdown
RUN bun run build --filter=@libraries/content-analysis
RUN bun run build --filter=@libraries/sdk

# Build web app (Vite + Nitro)
RUN bun run build --filter=web

# Stage 2: Production Runner
FROM node:22-alpine AS runner

WORKDIR /app

# Copy built output from builder
COPY --from=builder /app/apps/web/.output ./.output

# Expose port
EXPOSE 3000

# Set environment to production
ENV NODE_ENV=production

# Start server
CMD ["node", ".output/server/index.mjs"]
