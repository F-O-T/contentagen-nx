import { task, logger, batch } from "@trigger.dev/sdk/v3";
import { chunkTextTask } from "../trigger/chunk-text";
import type { chunkDistillationTask } from "../trigger/chunk-distillation";
import type { distilledChunkFormatterAndSaveOnChroma } from "../trigger/save-chunk";
export async function runDistillationPipeline(payload: {
   inputText: string;
   agentId: string;
   sourceId: string;
}) {
   const { inputText, agentId, sourceId } = payload;
   logger.info("Starting distillation pipeline", { agentId });
   try {
      // 1. Chunking
      const chunkingResult = await chunkTextTask.triggerAndWait({
         inputText,
      });
      if (!chunkingResult.ok) {
         logger.error("Chunking failed", {
            agentId,
         });
         throw new Error(
            "Chunking failed. Please ensure the input text is valid and try again.",
         );
      }
      const chunks = chunkingResult.output.chunks;
      // 2. Distillation
      logger.info("Distilling chunks", { chunkCount: chunks.length });

      const results = await batch.triggerAndWait<typeof chunkDistillationTask>(
         chunks.map((chunk) => ({
            id: "chunk-distillation-job",
            payload: { chunk },
         })),
      );
      const distilledChunks = results.runs.map((result) => {
         if (result.ok) {
            return result.output.distilledChunk;
         } else {
            logger.error("Chunk distillation failed", {
               error: result.error,
               agentId,
            });
            throw new Error(
               "Chunk distillation failed. Please check the logs for more details.",
            );
         }
      });
      logger.info("Distillation completed", {
         distilledChunkCount: distilledChunks.length,
      });
      await batch.trigger<typeof distilledChunkFormatterAndSaveOnChroma>(
         distilledChunks.map((chunk) => ({
            id: "distilled-chunk-formatter-and-save-on-chroma-job",
            payload: { chunk, agentId, sourceId },
         })),
      );
      logger.info("Knowledge distillation pipeline complete", {
         agentId,
         formattedChunkCount: distilledChunks.length,
      });
   } catch (error) {
      logger.error("Error in distillation pipeline", {
         error: error instanceof Error ? error.message : error,
         agentId,
      });
      throw error;
   }
}

export const knowledgeDistillationTask = task({
   id: "knowledge-distillation-job",
   run: runDistillationPipeline,
});
