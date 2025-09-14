import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runCrawlCompetitorWebsite } from "../../functions/web-search/crawl-competitor-website";
import { enqueueCompetitorAnalysisJob } from "./competitor-analysis-queue";
import { updateCompetitorStatus } from "../../functions/database/update-competitor-status";

export type CompetitorCrawlJob = {
   competitorId: string;
   userId: string;
   organizationId: string;
   websiteUrl: string;
};

const QUEUE = "competitor-crawl";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const competitorCrawlQueue = new Queue<CompetitorCrawlJob>(QUEUE, {
   connection: redis,
});
registerGracefulShutdown(competitorCrawlQueue);

export async function enqueueCompetitorCrawlJob(job: CompetitorCrawlJob) {
   return competitorCrawlQueue.add(QUEUE, job);
}

export const competitorCrawlWorker = new Worker<CompetitorCrawlJob>(
   QUEUE,
   async (job: Job<CompetitorCrawlJob>) => {
      const { competitorId, userId, organizationId, websiteUrl } = job.data;

      try {
         // Update status to crawling
         await updateCompetitorStatus({
            competitorId,
            status: "crawling",
         });

         const { results } = await runCrawlCompetitorWebsite({
            userId,
            websiteUrl,
         });

         await enqueueCompetitorAnalysisJob({
            competitorId,
            userId,
            organizationId,
            websiteUrl,
            crawlResults: results,
         });
      } catch (error) {
         // Update status to failed on error
         await updateCompetitorStatus({
            competitorId,
            status: "failed",
         });
         throw error;
      }
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(competitorCrawlWorker);
