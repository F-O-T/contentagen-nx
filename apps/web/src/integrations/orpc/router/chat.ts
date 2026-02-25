import { mastra } from "@packages/agents";
import { z } from "zod";
import { protectedProcedure } from "../server";

/**
 * Get recent Mastra memory threads for the current user within a team context.
 * Threads are keyed by resourceId = `${teamId}:${userId}`.
 */
export const getRecentThreads = protectedProcedure
   .input(
      z.object({
         teamId: z.uuid(),
         limit: z.number().int().min(1).max(20).default(5),
      }),
   )
   .handler(async ({ context, input }) => {
      const { userId } = context;
      const resourceId = `${input.teamId}:${userId}`;

      const storage = mastra.getStorage();
      if (!storage) {
         return [];
      }

      const memoryStore = await storage.getStore("memory");
      if (!memoryStore) {
         return [];
      }

      const result = await memoryStore.listThreads({
         filter: { resourceId },
         perPage: input.limit,
         orderBy: { field: "updatedAt", direction: "DESC" },
      });

      return result.threads.slice(0, input.limit).map((thread) => ({
         id: thread.id,
         title: thread.title ?? "Nova conversa",
         updatedAt: thread.updatedAt,
      }));
   });
