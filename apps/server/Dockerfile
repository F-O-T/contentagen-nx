FROM oven/bun:latest AS build
ARG DATABASE_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_TRUSTED_ORIGINS

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./

# Copy server package files
COPY /apps/server/package.json ./apps/server/package.json
COPY /tooling/typescript/package.json ./tooling/typescript/package.json
# Install all dependencies (monorepo-aware)
RUN bun install


# Copy server source code
COPY /apps/server ./apps/server
COPY /tooling/typescript ./tooling/typescript

ENV NODE_ENV=production

RUN bun build \
	--compile \
	--minify-whitespace \
	--minify-syntax \
	--target bun \
	--outfile server \
./apps/server/src/index.ts

FROM gcr.io/distroless/base

WORKDIR /app

COPY --from=build /app/server server

ENV NODE_ENV=production

ARG PORT

CMD ["./server"]
EXPOSE ${PORT}
