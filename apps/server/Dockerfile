FROM oven/bun:latest AS builder
ARG DATABASE_URL
ARG REDIS_URL
ARG RESEND_API_KEY
ARG POLAR_ACCESS_TOKEN
ARG POLAR_SUCCESS_URL
ARG OPENROUTER_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS

WORKDIR /app

# Copy all package manifests and the lockfile first.
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/brand/package.json ./packages/brand/
COPY packages/billing-limits/package.json ./packages/billing-limits/


# Install all dependencies (monorepo-aware)
RUN bun install

# Copy source code
COPY . .

ENV NODE_ENV=production
RUN bun build \
  --minify-whitespace \
  --minify-syntax \
  --target bun \
  --outfile ./dist/index.js \
  ./apps/server/src/index.ts

# ---

# Stage 2: Create a clean, production-only node_modules folder
FROM oven/bun:latest AS deps
WORKDIR /app

# Copy all package manifests and lockfile again
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/brand/package.json ./packages/brand/
COPY packages/billing-limits/package.json ./packages/billing-limits/
# Install only production dependencies.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM oven/bun:latest AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy the pruned, production-only node_modules from the 'deps' stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/dist ./dist

# Also copy the final package.json to the root of the app directory.
COPY --from=deps /app/package.json ./package.json

ARG PORT
EXPOSE ${PORT}
CMD ["bun", "./dist/index.js"]
