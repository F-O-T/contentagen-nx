import { z } from "zod";
import { protectedProcedure, router } from "../trpc";

const AgentKnowledgeIdInput = z.object({
   id: z.string(),
});

export const agentKnowledgeRouter = router({
   getById: protectedProcedure
      .input(AgentKnowledgeIdInput)
      .query(async ({ ctx, input }) => {
         // Query Chroma DB for the knowledge by ID
         const { id } = input;
         // Replace 'collection' with your actual collection name
         const collection = await (await ctx).chromaClient.getCollection({
            name: "agent-knowledge",
         });
         const result = await collection.get({ ids: [id] });
         return result;
      }),

   deleteById: protectedProcedure
      .input(AgentKnowledgeIdInput)
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const collection = await (await ctx).chromaClient.getCollection({
            name: "agent-knowledge",
         });
         await collection.delete({ ids: [id] });
         return { success: true };
      }),
});
