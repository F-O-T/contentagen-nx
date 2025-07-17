import { Type } from "@sinclair/typebox";
import { wrap } from "@typeschema/typebox";
import { protectedProcedure, router } from "../trpc";

const AgentKnowledgeIdInput = Type.Object({
   id: Type.String(),
});

export const agentKnowledgeRouter = router({
   getById: protectedProcedure
      .input(wrap(AgentKnowledgeIdInput))
      .query(async ({ ctx, input }) => {
         // Query Chroma DB for the knowledge by ID
         const { id } = input;
         // Replace 'collection' with your actual collection name
         const collection = await ctx.chromaClient.getCollection({
            name: "agent-knowledge",
         });
         const result = await collection.get({ ids: [id] });
         return result;
      }),

   deleteById: protectedProcedure
      .input(wrap(AgentKnowledgeIdInput))
      .mutation(async ({ ctx, input }) => {
         const { id } = input;
         const collection = await ctx.chromaClient.getCollection({
            name: "agent-knowledge",
         });
         await collection.delete({ ids: [id] });
         return { success: true };
      }),
});
