import { task, logger } from "@trigger.dev/sdk/v3";

import {
   getChunkingPrompt,
   getDistillationPrompt,
   getFormattingPrompt,
} from "@packages/prompts/helpers/knowledge-distillation-helper";
import { generateOpenRouterText } from "@packages/openrouter/helpers";
import {
   createOpenrouterClient,
   type OpenRouterClient,
} from "@packages/openrouter/client";
import {
   createChromaClient,
   type ChromaClient,
} from "@packages/chroma-db/client";
import {
   getOrCreateCollection,
   addToCollection,
} from "@packages/chroma-db/helpers";
import { serverEnv } from "@packages/environment/server";
const chroma = createChromaClient(serverEnv.CHROMA_DB_URL);
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);
export async function runDistillationPipeline(payload: {
   inputText: string;
   openrouter: OpenRouterClient;
   chroma: ChromaClient;
   agentId: string;
}) {
   const { inputText, agentId } = payload;
   logger.info("Starting distillation pipeline", { agentId });
   try {
      // 1. Chunking
      logger.info("Chunking input text", { inputLength: inputText.length });
      const chunkingResult = await generateOpenRouterText(openrouter, {
         system: getChunkingPrompt(),
         prompt: inputText,
      });
      const chunks = chunkingResult.text
         .split(/---CHUNK---/)
         .map((c) => c.trim())
         .filter(Boolean);
      logger.info("Chunking complete", {
         chunkCount: chunks.length,
         chunksPreview: chunks.slice(0, 3),
      });

      // 2. Distillation
      logger.info("Distilling chunks", { chunkCount: chunks.length });
      const distilledChunks: string[] = [];
      for (const [i, chunk] of chunks.entries()) {
         logger.info("Distilling chunk", {
            index: i,
            chunkLength: chunk.length,
         });
         const result = await generateOpenRouterText(openrouter, {
            prompt: chunk,
            system: getDistillationPrompt(),
         });
         distilledChunks.push(result.text.trim());
      }
      logger.info("Distillation complete", {
         distilledCount: distilledChunks.length,
         distilledPreview: distilledChunks.slice(0, 3),
      });

      // 3. Formatting (each distilled chunk individually)
      logger.info("Formatting each distilled chunk", {
         distilledCount: distilledChunks.length,
      });
      if (!distilledChunks.length || distilledChunks.every((c) => !c.trim())) {
         throw new Error(
            "No knowledge chunk provided for formatting. Please provide the analyzed knowledge chunk text.",
         );
      }
      const { collection } = await getOrCreateCollection(
         chroma,
         "AgentKnowledge",
      );
      const formattedChunks: string[] = [];
      for (const chunk of distilledChunks) {
         const formattingResult = await generateOpenRouterText(openrouter, {
            system: getFormattingPrompt(),
            prompt: chunk,
         });
         const formatted = formattingResult.text.trim();
         formattedChunks.push(formatted);
         await addToCollection(collection, {
            ids: [crypto.randomUUID()],
            documents: [formatted],
            metadatas: [
               {
                  agentId,
                  sourceType: "file_upload",
                  summary: formatted.slice(0, 200),
               },
            ],
         });
      }
      logger.info("Distillation pipeline complete", {
         agentId,
         formattedChunksCount: formattedChunks.length,
      });
      return {
         formattedChunks,
         distilledChunks,
         chunks,
      };
   } catch (error) {
      logger.error("Error in distillation pipeline", {
         error: error instanceof Error ? error.message : error,
         agentId,
      });
      throw error;
   }
}

export const distillationTask = task({
   id: "distillation-job",
   run: runDistillationPipeline,
});
