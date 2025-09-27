# apps/docs/Dockerfile
# Stage 1: Install dependencies and build the application
FROM oven/bun:latest AS builder

WORKDIR /app

# Copy all package manifests and the lockfile first.
# This takes advantage of Docker's layer caching, speeding up subsequent builds.
COPY bun.lock ./
COPY package.json ./
COPY apps/docs/package.json ./apps/docs/
COPY packages/ui/package.json ./packages/ui/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install all dependencies (including devDependencies needed for the build step)
RUN bun install 

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the docs application.
# The build output will be in /app/apps/docs/dist
ENV NODE_ENV=production
RUN bun run --filter=docs build

# ---

# Stage 2: Create the final production image with nginx
FROM nginx:alpine AS runner

# Copy nginx configuration
COPY apps/docs/nginx.conf /etc/nginx/nginx.conf

# Copy the entrypoint script
COPY apps/docs/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Copy the built static files from the 'builder' stage
COPY --from=builder /app/apps/docs/dist /usr/share/nginx/html

# Set and expose the port. Default to 4323 if not provided.
ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start nginx using the entrypoint script
ENTRYPOINT ["/entrypoint.sh"]


