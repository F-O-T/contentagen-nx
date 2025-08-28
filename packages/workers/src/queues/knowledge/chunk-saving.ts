import { Worker, Queue, type Job } from "bullmq";
import { runCunkSaving } from "../../functions/rag/save-chunk";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { updateAgentKnowledgeStatus } from "../../functions/database/update-agent-status";

export type ChunkSavingJob = {
   chunk: string;
   agentId: string;
   sourceId: string;
}[];

const QUEUE_NAME = "chunk-saving-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const chunkSavingQueue = new Queue<ChunkSavingJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(chunkSavingQueue);

export async function enqueueChunkSavingJob(job: ChunkSavingJob) {
   return chunkSavingQueue.add("chunk-saving", job);
}

export const chunkSavingWorker = new Worker<ChunkSavingJob>(
   QUEUE_NAME,
   async (job: Job<ChunkSavingJob>) => {
      try {
         const agentId = job.data[0]?.agentId;
         if (!agentId) {
            throw new Error("Agent ID is missing in chunk saving job data");
         }
         const msg = `Indexed ${job.data.length} chunks to knowledge base`;
         const result = await runCunkSaving({ items: job.data });
         await updateAgentKnowledgeStatus(agentId, "completed", msg);

         return result;
      } catch (error) {
         console.error("Error processing chunk saving job:", error);
         throw error;
      }
   },
   {
      connection: redis,
      concurrency: 2,
      limiter: { max: 5, duration: 1000 },
      removeOnComplete: { count: 10 },
   },
);
registerGracefulShutdown(chunkSavingWorker);

console.info(
   "[ChunkSaving] Worker initialized with concurrency=2 and rate limit 5/sec",
);
