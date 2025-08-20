import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

export interface KnowledgeDistillationJob {
   inputText: string;
   agentId: string;
   sourceId: string;
   userId: string;
}

export async function runKnowledgeDistillation(
   payload: KnowledgeDistillationJob,
) {
   const { agentId } = payload;
   console.info("Starting distillation pipeline", { agentId });
   return;
}

const QUEUE_NAME = "knowledge-distillation-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const knowledgeDistillationQueue = new Queue<KnowledgeDistillationJob>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(knowledgeDistillationQueue);

export async function enqueueKnowledgeDistillationJob(
   job: KnowledgeDistillationJob,
) {
   return knowledgeDistillationQueue.add("knowledge-distillation", job);
}

export const knowledgeDistillationWorker = new Worker<KnowledgeDistillationJob>(
   QUEUE_NAME,
   async (job: Job<KnowledgeDistillationJob>) => {
      await runKnowledgeDistillation(job.data);
   },
   {
      removeOnComplete: {
         count: 10,
      },
      connection: redis,
   },
);
registerGracefulShutdown(knowledgeDistillationWorker);
