import { getChromaClient } from "@packages/chroma-db/client";
import { queryCollection, getCollection } from "@packages/chroma-db/helpers";

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const queryBrandKnowledgeTool = createTool({
   id: "query-brand-knowledge",
   description: "Query the brand knowledge rag",
   inputSchema: z.object({
      agentId: z.string().describe("The agent ID"),
      keywords: z.array(z.string()).describe("The keywords to search for"),
   }),
   execute: async ({ context }) => {
      const { agentId, keywords } = context;

      const chroma = getChromaClient();
      try {
         const collection = await getCollection(chroma, "AgentKnowledge");

         const chunks = await queryCollection(collection, {
            nResults: 30,
            where: {
               agentId: agentId,
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
