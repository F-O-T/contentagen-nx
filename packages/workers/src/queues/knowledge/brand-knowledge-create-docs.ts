import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runCreateBrandDocuments } from "../../functions/chunking/get-brand-document-chunks";
import { updateAgentKnowledgeStatus } from "../../functions/database/update-agent-status";
import { enqueueBrandUploadJob } from "./brand-knowledge-upload";

export type BrandCreateDocsJob = {
   agentId: string;
   userId: string;
   websiteUrl: string;
   fullBrandAnalysis: string;
};

const QUEUE_NAME = "brand-knowledge-create-docs";
const redis = createRedisClient(serverEnv.REDIS_URL);
export const brandCreateDocsQueue = new Queue<BrandCreateDocsJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(brandCreateDocsQueue);

export async function enqueueBrandCreateDocsJob(job: BrandCreateDocsJob) {
   return brandCreateDocsQueue.add(QUEUE_NAME, job);
}

export const brandCreateDocsWorker = new Worker<BrandCreateDocsJob>(
   QUEUE_NAME,
   async (job: Job<BrandCreateDocsJob>) => {
      const { agentId, userId, websiteUrl, fullBrandAnalysis } = job.data;
      await updateAgentKnowledgeStatus(
         agentId,
         "chunking",
         `Creating your documents for ${websiteUrl}`,
      );
      const { documents } = await runCreateBrandDocuments({
         userId,
         inputText: fullBrandAnalysis,
      });
      await updateAgentKnowledgeStatus(
         agentId,
         "chunking",
         `Created ${documents.length} documents for ${websiteUrl}`,
      );

      await enqueueBrandUploadJob({
         agentId,
         userId,
         websiteUrl,
         documents,
      });
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(brandCreateDocsWorker);
