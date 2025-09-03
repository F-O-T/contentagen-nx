import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestLlmBilling } from "../functions/billing/ingest-usage";

export interface BillingLlmIngestionJob {
   inputTokens?: number;
   outputTokens?: number;
   effort: "small";
   userId: string;
}

export async function runBillingLlmIngestion(payload: BillingLlmIngestionJob) {
   await ingestLlmBilling(payload);
}

const QUEUE_NAME = "billing-llm-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingLlmIngestionQueue = new Queue<BillingLlmIngestionJob>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(billingLlmIngestionQueue);

export async function enqueueBillingLlmIngestionJob(
   job: BillingLlmIngestionJob,
) {
   return billingLlmIngestionQueue.add("billing-llm-ingestion", job);
}

export const billingLlmIngestionWorker = new Worker<BillingLlmIngestionJob>(
   QUEUE_NAME,
   async (job: Job<BillingLlmIngestionJob>) => {
      await runBillingLlmIngestion(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(billingLlmIngestionWorker);
