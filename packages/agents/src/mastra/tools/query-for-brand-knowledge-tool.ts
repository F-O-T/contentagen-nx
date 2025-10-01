import { createTool } from "@mastra/core/tools";
import { serverEnv } from "@packages/environment/server";
import { createPgVector } from "@packages/rag/client";
import { searchBrandKnowledgeByTextAndExternalId } from "@packages/rag/repositories/brand-knowledge-repository";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";

export const queryForBrandKnowledge = createTool({
   id: "query-for-brand-knowledge",
   description: "Query the pg vector database for brand knowledge",
   inputSchema: z.object({
      externalId: z
         .string()
         .describe("The external id for identifying the brand"),
      searchTerm: z.string().describe("The search term to query the database"),
      type: z
         .enum(["document", "feature"])
         .describe("The type of knowledge to search for"),
   }),
   execute: async ({ context }) => {
      const { externalId, searchTerm, type } = context;

      try {
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });
         const results = await searchBrandKnowledgeByTextAndExternalId(
            ragClient,
            searchTerm,
            externalId,
            {
               type,
               limit: 10,
               similarityThreshold: 0.7,
            },
         );
         // Always return something, even if it's an empty array
         return { results: results || [] };
      } catch (error) {
         console.error("Failed to search brand knowledge:", error);
         propagateError(error);
         throw AppError.internal(
            `Failed to search brand knowledge: ${(error as Error).message}`,
         );
      }
   },
});
