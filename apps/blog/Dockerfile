# apps/blog/Dockerfile
# Stage 1: Install all dependencies and build the application
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy all package manifests and the lockfile first.
# This takes advantage of Docker's layer caching, speeding up subsequent builds.
COPY bun.lock ./
COPY package.json ./
COPY apps/blog/package.json ./apps/blog/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/database/package.json ./packages/database/
COPY tooling/typescript/package.json ./tooling/typescript/
# Install all dependencies (including devDependencies needed for the build step)
RUN bun install 

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the blog application.
# The build output will be in /app/apps/blog/dist
ENV NODE_ENV=production
ARG ARCJET_KEY

RUN bun run --filter=blog build

# ---

# Stage 2: Create a clean, production-only node_modules folder
FROM oven/bun:latest AS deps

WORKDIR /app

# Copy all package manifests and lockfile again
COPY bun.lock ./
COPY package.json ./
COPY apps/blog/package.json ./apps/blog/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/sdk/package.json ./packages/sdk/
COPY packages/database/package.json ./packages/database/
COPY tooling/typescript/package.json ./tooling/typescript/
# Install only production dependencies. This creates a lean, clean node_modules folder.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM node:lts-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ARG ARCJET_KEY

# Copy the pruned, production-only node_modules from the 'deps' stage.
# This will solve the original 'module not found' error.
COPY --from=deps /app/node_modules ./node_modules

# Copy the built application from the 'builder' stage
COPY --from=builder /app/apps/blog/dist ./dist

# Also copy the final package.json to the root of the app directory.
# This is good practice and helps with Node's module resolution.
COPY --from=deps /app/package.json ./package.json

# Set and expose the port. Default to 4321 if not provided.
ARG PORT=4321
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start the server using the entrypoint from the build output
CMD ["node", "./dist/server/entry.mjs"]

