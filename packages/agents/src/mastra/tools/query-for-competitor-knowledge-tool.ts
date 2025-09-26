import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import { searchCompetitorKnowledgeByTextAndExternalId } from "@packages/rag/repositories/competitor-knowledge-repository";
import { z } from "zod";

export const queryForCompetitorKnowledge = createTool({
   id: "query-for-competitor-knowledge",
   description: "Query the pg vector database for competitor knowledge",
   inputSchema: z.object({
      externalIds: z
         .array(z.string())
         .describe("An array of external ids for identifying the competitors"),
      searchTerm: z.string().describe("The search term to query the database"),
      type: z
         .enum(["document", "feature"])
         .describe("The type of knowledge to search for"),
   }),
   execute: async ({ context }) => {
      const { externalIds, searchTerm, type } = context;

      try {
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });
         const results = await searchCompetitorKnowledgeByTextAndExternalId(
            ragClient,
            searchTerm,
            externalIds,
            {
               type,
            },
         );
         return { results };
      } catch (error) {
         console.error("Failed to search brand knowledge:", error);
         throw error;
      }
   },
});
