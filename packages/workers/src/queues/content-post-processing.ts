import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { runContentPostProcessing } from "../functions/content-post-processing";
import type { ContentRequest } from "@packages/database/schema";

const QUEUE_NAME = "content-post-processing";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentPostProcessingQueue = new Queue(QUEUE_NAME, {
  connection: redis,
});
registerGracefulShutdown(contentPostProcessingQueue);

export const contentPostProcessingWorker = new Worker(
  QUEUE_NAME,
  async (
    job: Job<{
      agentId: string;
      contentId: string;
      userId: string;
      content: string;
      keywords: string[];
      sources: string[];
      contentRequest: ContentRequest;
    }>,
  ) => {
    await runContentPostProcessing(job.data);
  },
  {
    connection: redis,
    removeOnComplete: {
      count: 10,
    },
  },
);
registerGracefulShutdown(contentPostProcessingWorker);

