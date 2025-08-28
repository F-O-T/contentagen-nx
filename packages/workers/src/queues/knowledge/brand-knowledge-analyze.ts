import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runWriteBrandDocument } from "../../functions/writing/write-brand-document";
import { updateAgentKnowledgeStatus } from "../../functions/database/update-agent-status";
import { enqueueBrandCreateDocsJob } from "./brand-knowledge-create-docs";

export type BrandAnalyzeJob = {
   agentId: string;
   userId: string;
   websiteUrl: string;
   crawlResults: Array<{ rawContent: string }>;
};

const QUEUE_NAME = "brand-knowledge-analyze";
const redis = createRedisClient(serverEnv.REDIS_URL);
export const brandAnalyzeQueue = new Queue<BrandAnalyzeJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(brandAnalyzeQueue);

export async function enqueueBrandAnalyzeJob(job: BrandAnalyzeJob) {
   return brandAnalyzeQueue.add(QUEUE_NAME, job);
}

export const brandAnalyzeWorker = new Worker<BrandAnalyzeJob>(
   QUEUE_NAME,
   async (job: Job<BrandAnalyzeJob>) => {
      const { agentId, userId, websiteUrl, crawlResults } = job.data;
      await updateAgentKnowledgeStatus(
         agentId,
         "analyzing",
         `Generating brand document for ${websiteUrl}`,
      );
      const { fullBrandAnalysis } = await runWriteBrandDocument({
         userId,
         websiteData: crawlResults.map((r) => r.rawContent).join("\n\n"),
      });
      await updateAgentKnowledgeStatus(
         agentId,
         "analyzing",
         `Generated brand document for ${websiteUrl}`,
      );

      await enqueueBrandCreateDocsJob({
         agentId,
         userId,
         websiteUrl,
         fullBrandAnalysis,
      });
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(brandAnalyzeWorker);
