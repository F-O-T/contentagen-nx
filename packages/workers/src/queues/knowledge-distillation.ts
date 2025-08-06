import { Worker, Queue, type Job } from "bullmq";
import { runChunkText } from "../functions/chunk-text";
import { runChunkDistillation } from "../functions/chunk-distillation";
import { runDistilledChunkFormatterAndSaveOnChroma } from "../functions/save-chunk";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";

export async function runDistillationPipeline(payload: {
   inputText: string;
   agentId: string;
   sourceId: string;
}) {
   const { inputText, agentId, sourceId } = payload;
   console.info("Starting distillation pipeline", { agentId });
   try {
      // 1. Chunking
      const chunkingResult = await runChunkText({ inputText });
      if (!chunkingResult || !chunkingResult.chunks) {
         console.error("Chunking failed", { agentId });
         throw new Error("Chunking failed. Please ensure the input text is valid and try again.");
      }
      const chunks = chunkingResult.chunks;
      // 2. Distillation
      console.info("Distilling chunks", { chunkCount: chunks.length });
      const distillationResults = await Promise.all(
         chunks.map(async (chunk) => {
            try {
               const result = await runChunkDistillation({ chunk });
               return result.distilledChunk;
            } catch (error) {
               console.error("Chunk distillation failed", { error, agentId });
               throw new Error("Chunk distillation failed. Please check the logs for more details.");
            }
         })
      );
      console.info("Distillation completed", { distilledChunkCount: distillationResults.length });
      await Promise.all(
         distillationResults.map(async (chunk) =>
            runDistilledChunkFormatterAndSaveOnChroma({ chunk, agentId, sourceId })
         )
      );
      console.info("Knowledge distillation pipeline complete", {
         agentId,
         formattedChunkCount: distillationResults.length,
      });
   } catch (error) {
      console.error("Error in distillation pipeline", {
         error: error instanceof Error ? error.message : error,
         agentId,
      });
      throw error;
   }
}

const QUEUE_NAME = "knowledge-distillation-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const knowledgeDistillationQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});

export const knowledgeDistillationWorker = new Worker(
   QUEUE_NAME,
   async (
      job: Job<{
         inputText: string;
         agentId: string;
         sourceId: string;
      }>,
   ) => {
      await runDistillationPipeline(job.data);
   },
   {
      connection: redis,
   },
);
