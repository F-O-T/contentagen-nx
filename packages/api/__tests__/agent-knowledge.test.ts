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

describe("agentKnowledge router", () => {
   const server = setupServer();

   beforeAll(() => server.listen());
   afterEach(() => server.resetHandlers());
   afterAll(() => server.close());

   type KnowledgeResult = {
      ids: string[];
      metadatas: Record<string, unknown>[];
      documents: string[];
      embeddings: number[][];
   };

   const knowledgeId = "knowledge-123";
   const knowledgeResult: KnowledgeResult = {
      ids: [knowledgeId],
      metadatas: [{ foo: "bar" }],
      documents: ["Some document text"],
      embeddings: [[0.1, 0.2, 0.3]],
   };

   describe("getById", () => {
      test("should get knowledge by id", async () => {
         server.use(
            mswTrpc.agentKnowledge.getById.query(() => knowledgeResult),
         );
         const result = await trpc.agentKnowledge.getById.query({
            id: knowledgeId,
         });
         expect(result).toEqual(knowledgeResult);
      });

      test("should throw NOT_FOUND if knowledge does not exist", async () => {
         server.use(
            mswTrpc.agentKnowledge.getById.query(() => {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Knowledge not found.",
               });
            }),
         );
         await expect(
            trpc.agentKnowledge.getById.query({ id: "nonexistent-id" }),
         ).rejects.toMatchObject({
            message: "Knowledge not found.",
            data: { code: "NOT_FOUND" },
         });
      });

      test("should throw INTERNAL_SERVER_ERROR on server error", async () => {
         server.use(
            mswTrpc.agentKnowledge.getById.query(() => {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Unexpected error.",
               });
            }),
         );
         await expect(
            trpc.agentKnowledge.getById.query({ id: knowledgeId }),
         ).rejects.toMatchObject({
            message: "Unexpected error.",
            data: { code: "INTERNAL_SERVER_ERROR" },
         });
      });
   });

   describe("deleteById", () => {
      test("should delete knowledge by id", async () => {
         server.use(
            mswTrpc.agentKnowledge.deleteById.mutation(() => ({
               success: true,
            })),
         );
         const result = await trpc.agentKnowledge.deleteById.mutate({
            id: knowledgeId,
         });
         expect(result).toEqual({ success: true });
      });

      test("should throw NOT_FOUND if knowledge does not exist", async () => {
         server.use(
            mswTrpc.agentKnowledge.deleteById.mutation(() => {
               throw new TRPCError({
                  code: "NOT_FOUND",
                  message: "Knowledge not found.",
               });
            }),
         );
         await expect(
            trpc.agentKnowledge.deleteById.mutate({ id: "nonexistent-id" }),
         ).rejects.toMatchObject({
            message: "Knowledge not found.",
            data: { code: "NOT_FOUND" },
         });
      });

      test("should throw INTERNAL_SERVER_ERROR on server error", async () => {
         server.use(
            mswTrpc.agentKnowledge.deleteById.mutation(() => {
               throw new TRPCError({
                  code: "INTERNAL_SERVER_ERROR",
                  message: "Unexpected error.",
               });
            }),
         );
         await expect(
            trpc.agentKnowledge.deleteById.mutate({ id: knowledgeId }),
         ).rejects.toMatchObject({
            message: "Unexpected error.",
            data: { code: "INTERNAL_SERVER_ERROR" },
         });
      });
   });
});
