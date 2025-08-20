import { Worker, Queue, type Job } from "bullmq";
import type { ContentRequest } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runGetAgent } from "../../functions/database/get-agent";
import { runGetContentKeywords } from "../../functions/chunking/get-content-keywords";
import { runRagByKeywords } from "../../functions/rag/brand-knowledge-rag-by-keywords";
import { runGetImprovedSearchQuery } from "../../functions/chunking/get-improved-search-query";

export interface ContentPlanningJob {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}

import { enqueueContentResearchJob } from "./content-researching-queue";

export async function runContentPlanning(payload: ContentPlanningJob) {
   const { agentId, contentId, contentRequest } = payload;
   const { description } = contentRequest;
   try {
      const { agent } = await runGetAgent({ agentId });
      const { userId } = agent;
      const [improvedSearchQueryResult, contentKeywordsResult] =
         await Promise.all([
            runGetImprovedSearchQuery({ inputText: description, userId }),
            runGetContentKeywords({ inputText: description, userId }),
         ]);
      const { optimizedQuery } = improvedSearchQueryResult;
      const { keywords } = contentKeywordsResult;
      const { chunks } = await runRagByKeywords({
         agentId: agent.id,
         keywords,
      });

      // Enqueue next job in the pipeline (researching)
      await enqueueContentResearchJob({
         agentId,
         contentId,
         contentRequest,
         userId,
         keywords,
         chunks,
         optimizedQuery,
      });

      return {
         userId,
         keywords,
         chunks,
         agentId,
         contentId,
         contentRequest,
         optimizedQuery,
      };
   } catch (error) {
      console.error("[ContentGeneration] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-planning-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentPlanningQueue = new Queue<ContentPlanningJob>(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(contentPlanningQueue);

export async function enqueueContentPlanningJob(job: ContentPlanningJob) {
   return contentPlanningQueue.add("content-planning", job);
}

export const contentPlanningWorker = new Worker<ContentPlanningJob>(
   QUEUE_NAME,
   async (job: Job<ContentPlanningJob>) => {
      await runContentPlanning(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentPlanningWorker);
