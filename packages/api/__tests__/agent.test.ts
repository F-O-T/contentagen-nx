import { createTRPCClient, httpLink } from "@trpc/client";
import { TRPCError } from "@trpc/server";
import { setupServer } from "msw/node";
import { describe, test, beforeAll, afterAll, expect, afterEach } from "vitest";
import { createTRPCMsw } from "msw-trpc";
import { httpLink as mswHttpLink } from "msw-trpc";
import SuperJSON from "superjson";
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

describe("agent router", () => {
  const server = setupServer();

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  const baseAgent = {
    userId: "user-123",
    personaConfig: {
      version: "2.1",
      metadata: { name: "Agent", description: "desc" },
    },
    systemPrompt: "You are an agent.",
    name: "Test Agent",
    description: "A test agent",
    isActive: true,
  };

  const agentId = "00000000-0000-0000-0000-000000000001";

  describe("create", () => {
    test("should successfully create agent with valid input", async () => {
      server.use(
        mswTrpc.agent.create.mutation(() => ({ ...baseAgent, id: agentId })),
      );
      const result = await trpc.agent.create.mutate(baseAgent);
      expect(result).toMatchObject({ ...baseAgent, id: agentId });
    });

    test("should throw validation error for missing required fields", async () => {
      server.use(
        mswTrpc.agent.create.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Missing required fields",
          });
        }),
      );
      await expect(trpc.agent.create.mutate({})).rejects.toMatchObject({
        message: "Missing required fields",
        data: { code: "BAD_REQUEST" },
      });
    });
  });

  describe("get", () => {
    test("should get agent by id", async () => {
      server.use(
        mswTrpc.agent.get.query(() => ({ ...baseAgent, id: agentId })),
      );
      const result = await trpc.agent.get.query({ id: agentId });
      expect(result).toMatchObject({ ...baseAgent, id: agentId });
    });

    test("should throw NOT_FOUND if agent does not exist", async () => {
      server.use(
        mswTrpc.agent.get.query(() => {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found.",
          });
        }),
      );
      await expect(
        trpc.agent.get.query({ id: "nonexistent-id" }),
      ).rejects.toMatchObject({
        message: "Agent not found.",
        data: { code: "NOT_FOUND" },
      });
    });
  });

  describe("list", () => {
    test("should list all agents", async () => {
      server.use(
        mswTrpc.agent.list.query(() => [{ ...baseAgent, id: agentId }]),
      );
      const result = await trpc.agent.list.query();
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toMatchObject({ ...baseAgent, id: agentId });
    });
  });

  describe("update", () => {
    test("should update agent fields", async () => {
      server.use(mswTrpc.agent.update.mutation(() => ({ success: true })));
      const result = await trpc.agent.update.mutate({
        id: agentId,
        name: "Updated Name",
      });
      expect(result).toEqual({ success: true });
    });

    test("should throw NOT_FOUND if agent does not exist", async () => {
      server.use(
        mswTrpc.agent.update.mutation(() => {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found.",
          });
        }),
      );
      await expect(
        trpc.agent.update.mutate({ id: "nonexistent-id", name: "Name" }),
      ).rejects.toMatchObject({
        message: "Agent not found.",
        data: { code: "NOT_FOUND" },
      });
    });

    test("should throw BAD_REQUEST if no fields to update", async () => {
      server.use(
        mswTrpc.agent.update.mutation(() => {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No fields to update.",
          });
        }),
      );
      await expect(
        trpc.agent.update.mutate({ id: agentId }),
      ).rejects.toMatchObject({
        message: "No fields to update.",
        data: { code: "BAD_REQUEST" },
      });
    });
  });

  describe("delete", () => {
    test("should delete agent by id", async () => {
      server.use(mswTrpc.agent.delete.mutation(() => ({ success: true })));
      const result = await trpc.agent.delete.mutate({ id: agentId });
      expect(result).toEqual({ success: true });
    });

    test("should throw NOT_FOUND if agent does not exist", async () => {
      server.use(
        mswTrpc.agent.delete.mutation(() => {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Agent not found.",
          });
        }),
      );
      await expect(
        trpc.agent.delete.mutate({ id: "nonexistent-id" }),
      ).rejects.toMatchObject({
        message: "Agent not found.",
        data: { code: "NOT_FOUND" },
      });
    });
  });
});
