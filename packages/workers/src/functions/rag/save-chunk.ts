import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   ensureCollections,
} from "@packages/chroma-db/helpers";

const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);

export async function runDistilledChunkFormatterAndSaveOnChroma(payload: {
   chunk: string;
   agentId: string;
   sourceId: string;
}) {
   const { chunk, agentId, sourceId } = payload;
   try {
      // Ensure all defined collections exist before using agent_knowledge
      const collections = await ensureCollections(chroma);
      const collection = collections["agent_knowledge"];

      await addToCollection(collection, {
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
