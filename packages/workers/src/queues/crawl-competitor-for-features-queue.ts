import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { mastra, setRuntimeContext } from "@packages/mastra";
export type CompetitorCrawlJob = {
   competitorId: string;
   userId: string;
   websiteUrl: string;
   runtimeContext?: {
      language: "en" | "pt";
      userId: string;
   };
};

const QUEUE = "crawl-competitor-for-features";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const crawlCompetitorForFeaturesQueue = new Queue<CompetitorCrawlJob>(
   QUEUE,
   {
      connection: redis,
   },
);
registerGracefulShutdown(crawlCompetitorForFeaturesQueue);

export async function enqueueCrawlCompetitorForFeaturesJob(
   job: CompetitorCrawlJob,
) {
   return crawlCompetitorForFeaturesQueue.add(QUEUE, job);
}

export const competitorCrawlWorker = new Worker<CompetitorCrawlJob>(
   QUEUE,
   async (job: Job<CompetitorCrawlJob>) => {
      const { competitorId, userId, websiteUrl, runtimeContext } = job.data;

      // Restore runtime context if it exists

      const run = await mastra
         .getWorkflow("crawlCompetitorForFeatures")
         .createRunAsync();
      if (runtimeContext) {
         setRuntimeContext(runtimeContext);
      }

      const result = await run.start({
         inputData: {
            websiteUrl,
            userId,
            competitorId,
         },
      });

      return {
         userId,
         competitorId,
         websiteUrl,
         result,
      };
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(competitorCrawlWorker);
