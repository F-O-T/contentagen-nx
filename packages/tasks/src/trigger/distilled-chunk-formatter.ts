import { task, logger } from "@trigger.dev/sdk/v3";
import { distillationPrompt } from "@packages/prompts/prompt/task/distillation";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { serverEnv } from "@packages/environment/server";
import { createChromaClient } from "@packages/chroma-db/client";
import {
   addToCollection,
   getOrCreateCollection,
} from "@packages/chroma-db/helpers";
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
async function runDistilledChunkFormatterAndSaveOnChroma(payload: {
   chunk: string;
   agentId: string;
}) {
   const { chunk, agentId } = payload;
   try {
      logger.info("Formatting distilled chunk", {
         chunkLength: chunk.length,
         chunk,
      });
      const result = await generateOpenRouterText(openrouter, {
         prompt: chunk,
         system: distillationPrompt(),
      });
      logger.info("Distillation result", {
         distilledTextLength: result.text.length,
         resultText: result.text,
      });

      const formattedChunk = result.text.trim();
      logger.info("Saving distilled chunk to ChromaDB", {
         distilledChunkLength: formattedChunk.length,
      });
      const collection = await getOrCreateCollection(chroma, "AgentKnowledge");
      await addToCollection(collection.collection, {
         documents: [formattedChunk],
         ids: [crypto.randomUUID()],
         metadatas: [
            {
               agentId: agentId,
               sourceType: "file_upload",
            },
         ],
      });
      logger.info("Distilled chunk saved to ChromaDB", {
         collectionName: collection.collection.name,
         documentCount: collection.collection.count(),
      });
      return {
         formattedChunk,
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
