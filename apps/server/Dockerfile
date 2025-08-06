FROM oven/bun:latest AS builder
ARG POLAR_PREMIUM_PLAN
ARG POLAR_PRO_PLAN
ARG DATABASE_URL
ARG BETTER_AUTH_GOOGLE_CLIENT_ID
ARG BETTER_AUTH_GOOGLE_CLIENT_SECRET
ARG ARCJET_KEY
ARG ARCJET_ENV
ARG POLAR_ACCESS_TOKEN
ARG POLAR_SUCCESS_URL
ARG RESEND_API_KEY
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS
ARG REDIS_URL
ARG OPENROUTER_API_KEY
ARG OPENAI_API_KEY
ARG AP_QUEUE_UI_PASSWORD
ARG AP_QUEUE_UI_USERNAME
ARG MINIO_ENDPOINT
ARG MINIO_ACCESS_KEY
ARG MINIO_SECRET_KEY
ARG MINIO_BUCKET
ARG TAVILY_API_KEY
ARG CHROMA_DB_URL

WORKDIR /app

# Copy all package manifests and the lockfile first.
COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/
COPY packages/tasks/package.json ./packages/tasks/
COPY packages/files/package.json ./packages/files/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/database/package.json ./packages/database/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/errors/package.json ./packages/errors/
COPY packages/chroma-db/package.json ./packages/chroma-db/
COPY packages/openrouter/package.json ./packages/openrouter/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/
COPY packages/tasks/package.json ./packages/tasks/
COPY packages/files/package.json ./packages/files/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/database/package.json ./packages/database/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/prompts ./packages/prompts
COPY packages/errors ./packages/errors
COPY packages/chroma-db ./packages/chroma-db
COPY packages/openrouter ./packages/openrouter
COPY packages/workers ./packages/workers

# Install all dependencies (monorepo-aware)
RUN bun install

# Copy the rest of the source code for all workspaces.
# This is crucial for the build step to access the server source code.
COPY . .

ENV NODE_ENV=production
ENV POLAR_PREMIUM_PLAN=${POLAR_PREMIUM_PLAN}
ENV POLAR_PRO_PLAN=${POLAR_PRO_PLAN}
ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_GOOGLE_CLIENT_ID=${BETTER_AUTH_GOOGLE_CLIENT_ID}
ENV BETTER_AUTH_GOOGLE_CLIENT_SECRET=${BETTER_AUTH_GOOGLE_CLIENT_SECRET}
ENV ARCJET_KEY=${ARCJET_KEY}
ENV ARCJET_ENV=${ARCJET_ENV}
ENV POLAR_ACCESS_TOKEN=${POLAR_ACCESS_TOKEN}
ENV POLAR_SUCCESS_URL=${POLAR_SUCCESS_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS}
ENV REDIS_URL=${REDIS_URL}
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV AP_QUEUE_UI_PASSWORD=${AP_QUEUE_UI_PASSWORD}
ENV AP_QUEUE_UI_USERNAME=${AP_QUEUE_UI_USERNAME}
ENV MINIO_ENDPOINT=${MINIO_ENDPOINT}
ENV MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
ENV MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
ENV MINIO_BUCKET=${MINIO_BUCKET}
ENV TAVILY_API_KEY=${TAVILY_API_KEY}
ENV CHROMA_DB_URL=${CHROMA_DB_URL}
RUN bun build \
    --minify-whitespace \
    --minify-syntax \
    --target bun \
    --outfile ./dist/index.js \
    ./apps/server/src/index.ts

# ---

# Stage 2: Create a clean, production-only node_modules folder and install ONNX Runtime
FROM oven/bun:latest AS deps
WORKDIR /app

COPY bun.lock ./
COPY package.json ./
COPY apps/server/package.json ./apps/server/
COPY tooling/typescript/package.json ./tooling/typescript/
COPY packages/brand/package.json ./packages/brand/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/
COPY packages/tasks/package.json ./packages/tasks/
COPY packages/files/package.json ./packages/files/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/database/package.json ./packages/database/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/prompts/package.json ./packages/prompts/
COPY packages/workers/package.json ./packages/workers/
COPY packages/errors/package.json ./packages/errors/
COPY packages/chroma-db/package.json ./packages/chroma-db/
COPY packages/openrouter/package.json ./packages/openrouter/
COPY packages/posthog/package.json ./packages/posthog/
COPY packages/environment/package.json ./packages/environment/
COPY packages/tasks/package.json ./packages/tasks/
COPY packages/files/package.json ./packages/files/
COPY packages/api/package.json ./packages/api/
COPY packages/authentication/package.json ./packages/authentication/
COPY packages/database/package.json ./packages/database/
COPY packages/payment/package.json ./packages/payment/
COPY packages/transactional/package.json ./packages/transactional/
COPY packages/arcjet/package.json ./packages/arcjet/
COPY packages/prompts ./packages/prompts
COPY packages/errors ./packages/errors
COPY packages/chroma-db ./packages/chroma-db
COPY packages/openrouter ./packages/openrouter

# Install only production dependencies.
RUN bun install 

# ---

# Stage 3: Create the final, small production image

FROM oven/bun:latest AS runner
WORKDIR /app
COPY --from=builder /app/server server

ENV NODE_ENV=production
ENV POLAR_PREMIUM_PLAN=${POLAR_PREMIUM_PLAN}
ENV POLAR_PRO_PLAN=${POLAR_PRO_PLAN}
ENV DATABASE_URL=${DATABASE_URL}
ENV BETTER_AUTH_GOOGLE_CLIENT_ID=${BETTER_AUTH_GOOGLE_CLIENT_ID}
ENV BETTER_AUTH_GOOGLE_CLIENT_SECRET=${BETTER_AUTH_GOOGLE_CLIENT_SECRET}
ENV ARCJET_KEY=${ARCJET_KEY}
ENV ARCJET_ENV=${ARCJET_ENV}
ENV POLAR_ACCESS_TOKEN=${POLAR_ACCESS_TOKEN}
ENV POLAR_SUCCESS_URL=${POLAR_SUCCESS_URL}
ENV RESEND_API_KEY=${RESEND_API_KEY}
ENV BETTER_AUTH_SECRET=${BETTER_AUTH_SECRET}
ENV BETTER_AUTH_TRUSTED_ORIGINS=${BETTER_AUTH_TRUSTED_ORIGINS}
ENV REDIS_URL=${REDIS_URL}
ENV OPENROUTER_API_KEY=${OPENROUTER_API_KEY}
ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV AP_QUEUE_UI_PASSWORD=${AP_QUEUE_UI_PASSWORD}
ENV AP_QUEUE_UI_USERNAME=${AP_QUEUE_UI_USERNAME}
ENV MINIO_ENDPOINT=${MINIO_ENDPOINT}
ENV MINIO_ACCESS_KEY=${MINIO_ACCESS_KEY}
ENV MINIO_SECRET_KEY=${MINIO_SECRET_KEY}
ENV MINIO_BUCKET=${MINIO_BUCKET}
ENV TAVILY_API_KEY=${TAVILY_API_KEY}
ENV CHROMA_DB_URL=${CHROMA_DB_URL}

RUN bun install 

# ---

# Stage 3: Create the final, small production image

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
