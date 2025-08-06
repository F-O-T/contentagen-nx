import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   getOrCreateCollection,
} from "@packages/chroma-db/helpers";
const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
export async function runDistilledChunkFormatterAndSaveOnChroma(payload: {
   chunk: string;
   agentId: string;
   sourceId: string;
}) {
   const { chunk, agentId, sourceId } = payload;
   try {
      const collection = await getOrCreateCollection(chroma, "AgentKnowledge");
      await addToCollection(collection.collection, {
         documents: [chunk],
         ids: [crypto.randomUUID()],
         metadatas: [
            {
               agentId: agentId,
               sourceType: "file_upload",
               sourceId: sourceId,
            },
         ],
      });
      return {
         chunk,
      };
   } catch (error) {
      console.error("Error saving chunk to Chroma:", error);
      throw error;
   }
}
