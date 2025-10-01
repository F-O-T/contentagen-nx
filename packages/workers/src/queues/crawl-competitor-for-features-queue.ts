import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
import { AppError, propagateError } from "@packages/utils/errors";
export type CompetitorCrawlJob = {
   competitorId: string;
   userId: string;
   websiteUrl: string;
   runtimeContext?: CustomRuntimeContext;
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

      try {
         // Restore runtime context if it exists
         const run = await mastra
            .getWorkflow("crawlCompetitorForFeatures")
            .createRunAsync();
         if (runtimeContext) {
            setRuntimeContext(runtimeContext);
         }

         const result = await run.start({
            runtimeContext: setRuntimeContext({
               language: runtimeContext?.language ?? "en",
               userId,
            }),

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
      } catch (error) {
         console.error("[CrawlCompetitorForFeatures] WORKFLOW ERROR", {
            competitorId,
            userId,
            websiteUrl,
            error: error instanceof Error ? error.message : error,
            stack: error instanceof Error && error.stack ? error.stack : undefined,
         });
         propagateError(error);
         throw AppError.internal(
            `Crawl competitor for features workflow failed: ${(error as Error).message}`
         );
      }
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(competitorCrawlWorker);
