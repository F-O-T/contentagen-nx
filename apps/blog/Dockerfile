# apps/blog/Dockerfile
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
COPY tooling/typescript/package.json ./tooling/typescript/

# Install all dependencies (including devDependencies needed for the build step)
RUN bun install

# Copy the rest of the source code for all workspaces.
# A .dockerignore file in your monorepo root is crucial for this step.
COPY . .

# Build the blog application.
# The build output will be in /app/apps/blog/dist
ENV NODE_ENV=production
ARG CONTENTAGEN_API_KEY
ARG CONTENTAGEN_AGENT_ID
RUN bun run --filter=blog build

# ---

# Stage 2: Serve with nginx
FROM nginx:alpine AS runner

# Copy the built static files from the builder stage
COPY --from=builder /app/apps/blog/dist /usr/share/nginx/html

# Copy custom nginx configuration and entrypoint script
COPY apps/blog/nginx.conf /etc/nginx/nginx.conf
COPY apps/blog/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Set and expose the port. Default to 4322 if not provided.
ARG PORT
ENV PORT=${PORT}
EXPOSE ${PORT}

# Start nginx with entrypoint script
CMD ["/entrypoint.sh"]

