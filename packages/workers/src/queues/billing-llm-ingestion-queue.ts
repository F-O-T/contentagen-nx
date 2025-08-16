import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestLlmBilling } from "../functions/ingest-usage";

const QUEUE_NAME = "billing-llm-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingLlmIngestionQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(billingLlmIngestionQueue);

export const billingLlmIngestionWorker = new Worker(
   QUEUE_NAME,
   async (
      job: Job<{
         inputTokens: number;
         outputTokens: number;
         effort: Parameters<typeof ingestLlmBilling>[0]["effort"];
         userId: string;
      }>,
   ) => {
      await ingestLlmBilling(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(billingLlmIngestionWorker);
