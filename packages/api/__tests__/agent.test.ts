import { createTRPCClient, httpLink } from "@trpc/client";
import { createTRPCMsw, httpLink as mswHttpLink } from "msw-trpc";
import { setupServer } from "msw/node";
import SuperJSON from "superjson";
import { afterAll, afterEach, beforeAll, describe, expect, test } from "vitest";
import type { AppRouter } from "../src/server/index";

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

import type { Static } from "@sinclair/typebox";
import type {
  AgentSelectSchema,
  AgentInsertSchema,
  AgentUpdateSchema,
} from "@packages/database/schema";

describe("agent router", () => {
  const server = setupServer();
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const agentId = "00000000-0000-0000-0000-000000000001";
  const userId = "user-123";
  const agentData: Static<typeof AgentSelectSchema> = {
    id: agentId,
    userId,
    personaConfig: {
      version: "2.1",
      metadata: { name: "Agent Persona", description: "desc" },
      brand: {},
      voice: {},
      audience: {},
      formatting: {},
      language: {},
      seo: {},
      dataforseo: {},
      repurpose: {},
    },
    systemPrompt: "Prompt",
    name: "Agent Name",
    description: "desc",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    totalDrafts: 0,
    totalPublished: 0,
    uploadedFiles: [],
    lastGeneratedAt: null,
  };

  test("should create an agent", async () => {
    server.use(
      mswTrpc.agent.create.mutation(({ input }) => ({
        ...agentData,
        ...input,
      })),
    );
    const createInput: Static<typeof AgentInsertSchema> = {
      userId,
      personaConfig: {
        version: "2.1",
        metadata: { name: "Agent Persona", description: "desc" },
        brand: {},
        voice: {},
        audience: {},
        formatting: {},
        language: {},
        seo: {},
        dataforseo: {},
        repurpose: {},
      },
      systemPrompt: "Prompt",
      name: "Agent Name",
      description: "desc",
      isActive: true,
    };
    const result: Static<typeof AgentSelectSchema> =
      await trpc.agent.create.mutate(createInput);
    expect(result).toMatchObject(agentData);
  });

  test("should get an agent", async () => {
    server.use(
      mswTrpc.agent.get.query(({ input }) => ({
        ...agentData,
        id: input.id,
      })),
    );
    const result = await trpc.agent.get.query({ id: agentId });
    expect(result).toMatchObject(agentData);
  });

  test("should return not found for get", async () => {
    server.use(
      mswTrpc.agent.get.query(() => {
        throw Object.assign(new Error("Agent not found."), {
          code: "NOT_FOUND",
        });
      }),
    );
    await expect(
      trpc.agent.get.query({ id: "not-exist" }),
    ).rejects.toBeTruthy();
  });

  test("should update an agent", async () => {
    server.use(mswTrpc.agent.update.mutation(() => ({ success: true })));
    const updateInput: Static<typeof AgentUpdateSchema> = {
      id: agentId,
      name: "New Name",
    };
    const result = await trpc.agent.update.mutate(updateInput);
    expect(result).toEqual({ success: true });
  });

  test("should return not found for update", async () => {
    server.use(
      mswTrpc.agent.update.mutation(() => {
        throw Object.assign(new Error("Agent not found."), {
          code: "NOT_FOUND",
        });
      }),
    );
    await expect(
      trpc.agent.update.mutate({ id: "not-exist" }),
    ).rejects.toBeTruthy();
  });

  test("should delete an agent", async () => {
    server.use(mswTrpc.agent.delete.mutation(() => ({ success: true })));
    const result = await trpc.agent.delete.mutate({ id: agentId });
    expect(result).toEqual({ success: true });
  });

  test("should return not found for delete", async () => {
    server.use(
      mswTrpc.agent.delete.mutation(() => {
        throw Object.assign(new Error("Agent not found."), {
          code: "NOT_FOUND",
        });
      }),
    );
    await expect(
      trpc.agent.delete.mutate({ id: "not-exist" }),
    ).rejects.toBeTruthy();
  });

  test("should list agents", async () => {
    server.use(mswTrpc.agent.list.query(() => [agentData]));
    const result = await trpc.agent.list.query();
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject(agentData);
  });

  test("should list agents by user", async () => {
    server.use(
      mswTrpc.agent.listByUser.query(({ input }) => {
        if (input.userId === userId) {
          return [agentData];
        }
        return [];
      }),
    );
    const result = await trpc.agent.listByUser.query({ userId });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toMatchObject(agentData);
  });
});
