import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestWebSearchBilling } from "../functions/billing/ingest-usage";

export type BillingWebSearchIngestionJobData = Parameters<
   typeof ingestWebSearchBilling
>[0];
const QUEUE_NAME = "billing-websearch-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingWebSearchIngestionQueue =
   new Queue<BillingWebSearchIngestionJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(billingWebSearchIngestionQueue);

export const billingWebSearchIngestionWorker =
   new Worker<BillingWebSearchIngestionJobData>(
      QUEUE_NAME,
      async (job: Job<BillingWebSearchIngestionJobData>) => {
         await ingestWebSearchBilling(job.data);
      },
      {
         connection: redis,
         removeOnComplete: {
            count: 10,
         },
      },
   );
registerGracefulShutdown(billingWebSearchIngestionWorker);

export function addBillingWebSearchIngestionJob(
   data: BillingWebSearchIngestionJobData,
) {
   return billingWebSearchIngestionQueue.add(QUEUE_NAME, data);
}
