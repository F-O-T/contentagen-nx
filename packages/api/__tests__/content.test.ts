import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCMsw, httpLink as mswHttpLink } from "msw-trpc";
import { setupServer } from "msw/node";
import SuperJSON from "superjson";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { AppRouter } from "../src/server/index";
import type { Static } from "@sinclair/typebox";
import type {
  ContentInsertSchema,
  ContentUpdateSchema,
  ContentSelectSchema,
} from "@packages/database/schema";

const mswTrpc = createTRPCMsw<AppRouter>({
  links: [
    mswHttpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return { "content-type": "application/json" };
      },
    }),
  ],
  transformer: { input: SuperJSON, output: SuperJSON },
});

const trpc = createTRPCClient<AppRouter>({
  links: [
    httpLink({
      url: "http://localhost:3000/trpc",
      headers() {
        return { "content-type": "application/json" };
      },
      transformer: SuperJSON,
    }),
  ],
});

describe("content router", () => {
  const server = setupServer();
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const contentId = "00000000-0000-0000-0000-000000000001";
  const agentId = "agent-123";
  const userId = "user-123";
  const contentData: Static<typeof ContentSelectSchema> = {
    id: contentId,
    agentId,
    userId,
    title: "Test Content",
    body: "This is a test content.",
    status: "draft",
    meta: {},
    request: { topic: "Test", briefDescription: "desc" },
    stats: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  test("should create content", async () => {
    server.use(
      mswTrpc.content.create.mutation(({ input }) => ({
        ...contentData,
        ...input,
        id: contentId,
      })),
    );
    const createInput: Static<typeof ContentInsertSchema> = {
      agentId,
      userId,
      title: "Test Content",
      body: "This is a test content.",
      status: "draft",
      meta: {},
      request: { topic: "Test", briefDescription: "desc" },
      stats: {},
    };
    const result = await trpc.content.create.mutate(createInput);
    expect(result).toMatchObject({ ...contentData, ...createInput });
  });

  test("should get content by id", async () => {
    server.use(
      mswTrpc.content.get.query(({ input }) => ({
        ...contentData,
        id: input.id,
      })),
    );
    const result = await trpc.content.get.query({ id: contentId });
    expect(result).toMatchObject(contentData);
  });

  test("should list contents", async () => {
    server.use(mswTrpc.content.list.query(() => [contentData]));
    const result = await trpc.content.list.query();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject(contentData);
  });

  test("should update content", async () => {
    server.use(mswTrpc.content.update.mutation(() => ({ success: true })));
    const updateInput: Static<typeof ContentUpdateSchema> = {
      id: contentId,
      title: "Updated Title",
    };
    const result = await trpc.content.update.mutate(updateInput);
    expect(result).toEqual({ success: true });
  });

  test("should delete content", async () => {
    server.use(mswTrpc.content.delete.mutation(() => ({ success: true })));
    const result = await trpc.content.delete.mutate({ id: contentId });
    expect(result).toEqual({ success: true });
  });

  test("should return not found for get", async () => {
    server.use(
      mswTrpc.content.get.query(() => {
        throw Object.assign(new Error("Not found"), { code: "NOT_FOUND" });
      }),
    );
    await expect(
      trpc.content.get.query({ id: "not-exist" }),
    ).rejects.toBeTruthy();
  });
});
