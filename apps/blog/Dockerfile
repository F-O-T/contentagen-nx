# apps/blog/Dockerfile
# Stage 1: Install all dependencies and build the application
FROM oven/bun:latest AS builder

ARG ARCJET_KEY
ARG CONTENTAGEN_API_KEY
ARG CONTENTAGEN_AGENT_ID

WORKDIR /app

# Copy all package manifests and the lockfile first.
# This takes advantage of Docker's layer caching, speeding up subsequent builds.
COPY bun.lock ./
COPY package.json ./
COPY apps/blog/package.json ./apps/blog/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/

COPY packages/errors/package.json ./packages/errors/
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
ARG CONTENTAGEN_API_KEY
ARG CONTENTAGEN_AGENT_ID
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
COPY packages/environment/package.json ./packages/environment/
COPY packages/errors/package.json ./packages/errors/

COPY packages/database/package.json ./packages/database/
COPY tooling/typescript/package.json ./tooling/typescript/
# Install only production dependencies. This creates a lean, clean node_modules folder.
RUN bun install 

# ---

# Stage 3: Create the final, small production image
FROM nginx:alpine AS runner

# Copy the built static files from the 'builder' stage
COPY --from=builder /app/apps/blog/dist /usr/share/nginx/html

# Copy custom nginx configuration if needed
# COPY nginx.conf /etc/nginx/nginx.conf

# Expose port 80 for nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]

