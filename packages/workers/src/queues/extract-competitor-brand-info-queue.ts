import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { registerGracefulShutdown, createRedisClient } from "../helpers";
import {
   mastra,
   setRuntimeContext,
   type CustomRuntimeContext,
} from "@packages/agents";
export type CompetitorCrawlJob = {
   competitorId: string;
   userId: string;
   websiteUrl: string;
   runtimeContext?: CustomRuntimeContext;
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
   },
   { connection: redis, removeOnComplete: { count: 10 } },
);
registerGracefulShutdown(competitorCrawlWorker);
