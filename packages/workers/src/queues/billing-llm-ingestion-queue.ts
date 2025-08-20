import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestLlmBilling } from "../functions/billing/ingest-usage";

export type BillingLlmIngestionJobData = Parameters<typeof ingestLlmBilling>[0];
const QUEUE_NAME = "billing-llm-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingLlmIngestionQueue = new Queue<BillingLlmIngestionJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(billingLlmIngestionQueue);

export const billingLlmIngestionWorker = new Worker<BillingLlmIngestionJobData>(
   QUEUE_NAME,
   async (job: Job<BillingLlmIngestionJobData>) => {
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

// Type-safe helper for adding jobs to the queue
export function addBillingLlmIngestionJob(data: BillingLlmIngestionJobData) {
   return billingLlmIngestionQueue.add(QUEUE_NAME, data);
}
