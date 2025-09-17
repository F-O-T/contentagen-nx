# apps/docs/Dockerfile
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
COPY packages/errors/package.json ./packages/errors/
COPY packages/database/package.json ./packages/database/
COPY tooling/typescript/package.json ./tooling/typescript/

# Install all dependencies (including devDependencies needed for the build step)
RUN bun install

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the docs application.
# The build output will be in /app/apps/docs/dist
ENV NODE_ENV=production
ARG ARCJET_KEY
RUN bun run --filter=docs build

# ---

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy the built static files from the builder stage
COPY --from=builder /app/apps/docs/dist /usr/share/nginx/html

# Copy custom nginx configuration and entrypoint script
COPY apps/docs/nginx.conf /etc/nginx/nginx.conf
COPY apps/docs/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set and expose the port. Default to 4323 if not provided.
ARG PORT=4323
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start nginx with entrypoint script
CMD ["/entrypoint.sh"]


