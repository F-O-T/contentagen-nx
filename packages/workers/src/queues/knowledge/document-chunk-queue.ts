import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runCreateAtomicChunks } from "../../functions/chunking/get-atomic-chunks";

import { enqueueChunkSavingJobsBulk } from "./chunk-saving";
export interface DocumentChunkJob {
   inputText: string;
   agentId: string;
   sourceId: string;
   userId: string;
}

export async function runDocumentChunking(payload: DocumentChunkJob) {
   const { inputText, userId, agentId, sourceId } = payload;
   const { chunks } = await runCreateAtomicChunks({
      userId,
      inputText,
   });
   if (chunks && chunks.length > 0) {
      await enqueueChunkSavingJobsBulk(
         chunks.map((chunk) => ({
            chunk,
            agentId,
            sourceId,
         })),
      );
   }
   return;
}

const QUEUE_NAME = "document-chunk-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const documentChunkQueue = new Queue<DocumentChunkJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(documentChunkQueue);

export async function enqueueDocumentChunkJob(job: DocumentChunkJob) {
   return documentChunkQueue.add("document-chunk", job);
}

export async function enqueueDocumentChunkJobsBulk(jobs: DocumentChunkJob[]) {
   return documentChunkQueue.addBulk(
      jobs.map((job) => ({
         name: "document-chunk",
         data: job,
      }))
   );
}

export const documentChunkWorker = new Worker<DocumentChunkJob>(
   QUEUE_NAME,
   async (job: Job<DocumentChunkJob>) => {
      await runDocumentChunking(job.data);
   },
   {
      removeOnComplete: {
         count: 10,
      },
      connection: redis,
   },
);
registerGracefulShutdown(documentChunkWorker);
