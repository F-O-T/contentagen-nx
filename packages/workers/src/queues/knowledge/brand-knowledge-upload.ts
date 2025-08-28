import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runUploadBrandChunks } from "../../functions/storage/upload-brand-chunks";
import { updateAgentKnowledgeStatus } from "../../functions/database/update-agent-status";
import { enqueueDocumentChunkJobsBulk } from "./document-chunk-queue";

export type BrandUploadJob = {
   agentId: string;
   userId: string;
   websiteUrl: string;
   documents: Array<{ content: string }>;
};

const QUEUE_NAME = "brand-knowledge-upload";
const redis = createRedisClient(serverEnv.REDIS_URL);
export const brandUploadQueue = new Queue<BrandUploadJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(brandUploadQueue);

export async function enqueueBrandUploadJob(job: BrandUploadJob) {
   return brandUploadQueue.add(QUEUE_NAME, job);
}

export const brandUploadWorker = new Worker<BrandUploadJob>(
   QUEUE_NAME,
   async (job: Job<BrandUploadJob>) => {
      const { agentId, userId, websiteUrl, documents } = job.data;

      await updateAgentKnowledgeStatus(
         agentId,
         "chunking",
         `Uploading and indexing your documents for ${websiteUrl}`,
      );
      const { uploadedFiles } = await runUploadBrandChunks({
         agentId,
         chunks: documents.map((d) => d.content),
      });

      // Do not mark completed here — final completion will be emitted by the chunk-saving worker
      await updateAgentKnowledgeStatus(
         agentId,
         "chunking",
         `Uploaded ${uploadedFiles.length} documents for ${websiteUrl}`,
      );

      // Enqueue document chunk jobs for indexing
      await enqueueDocumentChunkJobsBulk(
         uploadedFiles.map((doc) => ({
            inputText: doc.rawContent,
            sourceId: doc.fileUrl,
            agentId,
            userId,
         })),
      );
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(brandUploadWorker);
