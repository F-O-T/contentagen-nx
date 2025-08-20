import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

export interface AutoBrandKnowledgeJob {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

export async function runAutoBrandKnowledge(payload: AutoBrandKnowledgeJob) {
   const { agentId, websiteUrl } = payload;
   console.log(
      `[auto-brand-knowledge] Job started for agentId=${agentId}, url=${websiteUrl}`,
   );
   return;
}

const QUEUE_NAME = "auto-brand-knowledge";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const autoBrandKnowledgeQueue = new Queue<AutoBrandKnowledgeJob>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(autoBrandKnowledgeQueue);

export async function enqueueAutoBrandKnowledgeJob(job: AutoBrandKnowledgeJob) {
   return autoBrandKnowledgeQueue.add("auto-brand-knowledge", job);
}

export const autoBrandKnowledgeWorker = new Worker<AutoBrandKnowledgeJob>(
   QUEUE_NAME,
   async (job: Job<AutoBrandKnowledgeJob>) => {
      await runAutoBrandKnowledge(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(autoBrandKnowledgeWorker);
