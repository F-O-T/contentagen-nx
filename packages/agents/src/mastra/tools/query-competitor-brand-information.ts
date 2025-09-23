import { getChromaClient } from "@packages/chroma-db/client";
import { queryCollection, getCollection } from "@packages/chroma-db/helpers";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const queryCompetitorBrandInformation = createTool({
   id: "query-competitor-brand-information",
   description: "Query the competitor brand information",
   inputSchema: z.object({
      organizationId: z.string().describe("The organization ID"),
      keywords: z.array(z.string()).describe("The keywords to search for"),
   }),
   execute: async ({ context }) => {
      const { organizationId, keywords } = context;

      const chroma = getChromaClient();
      try {
         const collection = await getCollection(chroma, "CompetitorKnowledge");

         const chunks = await queryCollection(collection, {
            nResults: 30,
            where: {
               organizationId: organizationId,
               type: "brand",
            },
            queryTexts: keywords,
         });
         const contextChunks = Array.isArray(chunks.documents)
            ? chunks.documents
                 .flat()
                 .filter((x): x is string => typeof x === "string")
            : [];

         return {
            chunks: contextChunks,
            total: contextChunks.length,
         };
      } catch (error) {
         console.error("Get brand knowledge rag error:", error);
         throw error;
      }
   },
});
