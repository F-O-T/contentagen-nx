import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import { queryCollection, getCollection } from "@packages/chroma-db/helpers";

const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);

export async function runRagByKeywords(payload: {
   agentId: string;
   keywords: string[];
}) {
   const { agentId, keywords } = payload;

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
      console.error("[knowledge-chunk-rag] Error:", error);
      throw error;
   }
}
