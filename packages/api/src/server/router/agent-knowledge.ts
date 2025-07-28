import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const AgentKnowledgeIdInput = z.object({
   id: z.string(),
});

const AgentKnowledgeAgentIdInput = z.object({
   agentId: z.string(),
});

import {
   getOrCreateCollection,
   CollectionName,
} from "@packages/chroma-db/helpers";

export const agentKnowledgeRouter = router({
   getById: protectedProcedure
      .input(AgentKnowledgeIdInput)
      .query(async ({ ctx, input }) => {
         const { id } = input;
         const { collection } = await getOrCreateCollection(
            (await ctx).chromaClient,
            "AgentKnowledge",
         );
         const result = await collection.get({ ids: [id] });
         return {
            ids: result.ids ?? [],
            documents: result.documents ?? [],
            metadatas: result.metadatas ?? [],
            embeddings: result.embeddings ?? [],
         };
      }),

   listByAgentId: protectedProcedure
      .input(AgentKnowledgeAgentIdInput)
      .query(async ({ ctx, input }) => {
         const { agentId } = input;
         const { collection } = await getOrCreateCollection(
            (await ctx).chromaClient,
            "AgentKnowledge",
         );
         const result = await collection.get({
            where: { agentId },
         });
         // Filter by agentId in metadata
         return result;
      }),

   deleteById: protectedProcedure
      .input(AgentKnowledgeIdInput)
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const { collection } = await getOrCreateCollection(
            (await ctx).chromaClient,
            "AgentKnowledge",
         );
         await collection.delete({ ids: [id] });
         return { success: true };
      }),
});
