import { toAISdkV5Messages } from "@mastra/ai-sdk/ui";
import { ORPCError } from "@orpc/server";
import { mastra } from "@packages/agents";
import { z } from "zod";
import { protectedProcedure } from "../server";

const getMemory = async () => {
   const memory = await mastra.getAgent("tecoAgent").getMemory();
   if (!memory)
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
         message: "Memory not configured",
      });
   return memory;
};

export const listThreads = protectedProcedure
   .input(
      z.object({
         teamId: z.uuid(),
         page: z.number().int().min(0).default(0),
         perPage: z.number().int().min(1).max(50).default(20),
      }),
   )
   .handler(async ({ context, input }) => {
      const memory = await getMemory();
      const result = await memory.listThreads({
         filter: { resourceId: `${input.teamId}:${context.userId}` },
         page: input.page,
         perPage: input.perPage,
         orderBy: { field: "updatedAt", direction: "DESC" },
      });
      return {
         threads: result.threads.map((t) => ({
            id: t.id,
            title: t.title ?? "Nova conversa",
            createdAt: t.createdAt,
            updatedAt: t.updatedAt,
         })),
         total: result.total,
         hasMore: result.hasMore,
      };
   });

export const createThread = protectedProcedure
   .input(
      z.object({
         teamId: z.uuid(),
         title: z.string().optional(),
         metadata: z.record(z.string(), z.unknown()).optional(),
      }),
   )
   .handler(async ({ context, input }) => {
      const memory = await getMemory();
      const thread = await memory.createThread({
         resourceId: `${input.teamId}:${context.userId}`,
         title: input.title,
         metadata: input.metadata,
      });
      return {
         id: thread.id,
         title: thread.title ?? "Nova conversa",
         createdAt: thread.createdAt,
      };
   });

export const deleteThread = protectedProcedure
   .input(z.object({ threadId: z.string() }))
   .handler(async ({ input, context }) => {
      const memory = await getMemory();
      const thread = await memory.getThreadById({ threadId: input.threadId });
      if (!thread?.resourceId?.endsWith(`:${context.userId}`)) {
         throw new ORPCError("FORBIDDEN", {
            message: "Thread not found or access denied",
         });
      }
      await memory.deleteThread(input.threadId);
   });

export const getThreadMessages = protectedProcedure
   .input(z.object({ threadId: z.string() }))
   .handler(async ({ input, context }) => {
      const memory = await getMemory();
      const thread = await memory.getThreadById({ threadId: input.threadId });
      if (!thread?.resourceId?.endsWith(`:${context.userId}`)) {
         throw new ORPCError("FORBIDDEN", {
            message: "Thread not found or access denied",
         });
      }
      const { messages } = await memory.recall({
         threadId: input.threadId,
         perPage: false,
      });
      // Strip data-* parts (Mastra workflow/agent metadata) from stored messages.
      // These parts are never meaningful to display, and DataUIDisplay in
      // @assistant-ui/react crashes during SSR because RuntimeAdapter does not
      // register the `dataRenderers` scope.
      return toAISdkV5Messages(messages);
   });
