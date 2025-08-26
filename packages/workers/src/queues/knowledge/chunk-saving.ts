import { Worker, Queue, type Job } from "bullmq";
import { runDistilledChunkFormatterAndSaveOnChroma } from "../../functions/rag/save-chunk";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";

export interface ChunkSavingJob {
   chunk: string;
   agentId: string;
   sourceId: string;
}

const QUEUE_NAME = "chunk-saving-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const chunkSavingQueue = new Queue<ChunkSavingJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(chunkSavingQueue);

export async function enqueueChunkSavingJob(job: ChunkSavingJob) {
   return chunkSavingQueue.add("chunk-saving", job);
}

export async function enqueueChunkSavingJobsBulk(jobs: ChunkSavingJob[]) {
   return chunkSavingQueue.addBulk(
      jobs.map((job) => ({
         name: "chunk-saving",
         data: job,
      }))
   );
}

export const chunkSavingWorker = new Worker<ChunkSavingJob>(
   QUEUE_NAME,
   async (job: Job<ChunkSavingJob>) => {
      console.info("[ChunkSaving] Processing chunk save job", {
         jobId: job.id,
         agentId: job.data.agentId,
         sourceId: job.data.sourceId,
      });

      try {
         const result = await runDistilledChunkFormatterAndSaveOnChroma(
            job.data,
         );
         console.info("[ChunkSaving] Chunk saved successfully", {
            jobId: job.id,
            agentId: job.data.agentId,
            sourceId: job.data.sourceId,
         });
         return result;
      } catch (error) {
         console.error("[ChunkSaving] Failed to save chunk", {
            jobId: job.id,
            agentId: job.data.agentId,
            sourceId: job.data.sourceId,
            error: error instanceof Error ? error.message : error,
         });
         throw error;
      }
   },
   {
      connection: redis,
      concurrency: 2, // Process 2 chunks at a time to avoid rate limits
      limiter: {
         max: 5, // Max 5 jobs per...
         duration: 1000, // ...1 second (5 jobs/second rate limit)
      },
      removeOnComplete: {
         count: 10, // Keep the last 100 completed job
      },
   },
);
registerGracefulShutdown(chunkSavingWorker);

console.info(
   "[ChunkSaving] Worker initialized with concurrency=2 and rate limit 5/sec",
);
