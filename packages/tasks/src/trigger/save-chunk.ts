import { task, logger } from "@trigger.dev/sdk/v3";
import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   getOrCreateCollection,
} from "@packages/chroma-db/helpers";
const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
async function runDistilledChunkFormatterAndSaveOnChroma(payload: {
   chunk: string;
   agentId: string;
   sourceId: string;
}) {
   const { chunk, agentId, sourceId } = payload;
   try {
      logger.info("Saving distilled chunk to ChromaDB", {
         distilledChunkLength: chunk.length,
      });
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
      logger.info("Distilled chunk saved to ChromaDB", {
         collectionName: collection.collection.name,
         documentCount: collection.collection.count(),
      });
      return {
         chunk,
      };
   } catch (error) {
      logger.error(
         "Error in distilled chunk formatter and save to chroma task",
         {
            error: error instanceof Error ? error.message : error,
         },
      );
      throw error;
   }
}

export const distilledChunkFormatterAndSaveOnChroma = task({
   id: "distilled-chunk-formatter-and-save-on-chroma-job",
   run: runDistilledChunkFormatterAndSaveOnChroma,
});
