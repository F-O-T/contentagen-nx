import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runCrawlWebsiteForBrandKnowledge } from "../../functions/web-search/crawl-website-for-brand-knowledge";
import { updateAgentKnowledgeStatus } from "../../functions/database/update-agent-status";
import { brandAnalyzeQueue } from "./brand-knowledge-analyze";
import type { BrandCrawlJob } from "./brand-knowledge-crawl";

const QUEUE = "brand-knowledge-crawl";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const brandCrawlQueue = new Queue<BrandCrawlJob>(QUEUE, {
   connection: redis,
});
registerGracefulShutdown(brandCrawlQueue);

export async function enqueueAutoBrandKnowledgeJob(job: BrandCrawlJob) {
   return brandCrawlQueue.add(QUEUE, job);
}

export const brandCrawlWorker = new Worker<BrandCrawlJob>(
   QUEUE,
   async (job: Job<BrandCrawlJob>) => {
      const { agentId, websiteUrl, userId } = job.data;
      await updateAgentKnowledgeStatus(
         agentId,
         "crawling",
         `Starting crawl of ${websiteUrl}`,
      );
      const { results } = await runCrawlWebsiteForBrandKnowledge({
         userId,
         websiteUrl,
      });
      await updateAgentKnowledgeStatus(
         agentId,
         "crawling",
         `Crawled ${results.length} pages from ${websiteUrl}`,
      );

      await brandAnalyzeQueue.add("brand-knowledge-analyze", {
         agentId,
         userId,
         websiteUrl,
         crawlResults: results,
      });
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(brandCrawlWorker);
