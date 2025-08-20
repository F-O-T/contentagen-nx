import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestWebSearchBilling } from "../functions/billing/ingest-usage";

export interface BillingWebSearchIngestionJob {
   method: "crawl" | "search";
   userId: string;
}

export async function runBillingWebSearchIngestion(
   payload: BillingWebSearchIngestionJob,
) {
   await ingestWebSearchBilling(payload);
}

const QUEUE_NAME = "billing-websearch-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingWebSearchIngestionQueue =
   new Queue<BillingWebSearchIngestionJob>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(billingWebSearchIngestionQueue);

export async function enqueueBillingWebSearchIngestionJob(
   job: BillingWebSearchIngestionJob,
) {
   return billingWebSearchIngestionQueue.add(
      "billing-websearch-ingestion",
      job,
   );
}

export const billingWebSearchIngestionWorker =
   new Worker<BillingWebSearchIngestionJob>(
      QUEUE_NAME,
      async (job: Job<BillingWebSearchIngestionJob>) => {
         await runBillingWebSearchIngestion(job.data);
      },
      {
         connection: redis,
         removeOnComplete: {
            count: 10,
         },
      },
   );
registerGracefulShutdown(billingWebSearchIngestionWorker);
