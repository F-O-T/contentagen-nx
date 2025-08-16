import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { ingestWebSearchBilling } from "../functions/ingest-usage";

const QUEUE_NAME = "billing-websearch-ingestion-job";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const billingWebSearchIngestionQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(billingWebSearchIngestionQueue);

export const billingWebSearchIngestionWorker = new Worker(
   QUEUE_NAME,
   async (
      job: Job<{
         method: Parameters<typeof ingestWebSearchBilling>[0]["method"];
         userId: string;
      }>,
   ) => {
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
