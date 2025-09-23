import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { mastra, setRuntimeContext } from "@packages/agents";
export type CompetitorCrawlJob = {
   competitorId: string;
   userId: string;
   websiteUrl: string;
   runtimeContext?: {
      language: "en" | "pt";
      userId: string;
   };
};

const QUEUE = "extract-competitor-brand-info";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const extractCompetitorBrandInfoQueue = new Queue<CompetitorCrawlJob>(
   QUEUE,
   {
      connection: redis,
   },
);
registerGracefulShutdown(extractCompetitorBrandInfoQueue);

export async function enqueueExtractCompetitorBrandInfoJob(
   job: CompetitorCrawlJob,
) {
   return extractCompetitorBrandInfoQueue.add(QUEUE, job);
}

export const competitorCrawlWorker = new Worker<CompetitorCrawlJob>(
   QUEUE,
   async (job: Job<CompetitorCrawlJob>) => {
      const { competitorId, userId, websiteUrl, runtimeContext } = job.data;

      // Restore runtime context if it exists

      const run = await mastra
         .getWorkflow("extractCompetitorBrandInfoWorkflow")
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
