import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import { searchCompetitorKnowledgeByTextAndExternalId } from "@packages/rag/repositories/competitor-knowledge-repository";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";

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
               limit: 20,
               similarityThreshold: 0,
            },
         );
         // Always return something, even if it's an empty array
         return { results: results || [] };
      } catch (error) {
         console.error("Failed to search competitor knowledge:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to search competitor knowledge: ${(error as Error).message}`,
         );
      }
   },
});
