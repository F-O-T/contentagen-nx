import { Worker, Queue, type Job } from "bullmq";
import type { ContentRequest } from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { updateContentStatus } from "../../functions/database/update-content-status";

export interface ContentWritingJobData {
   userId: string;
   searchSources: string[];
   webSearchContent: string;
   brandDocument: string;
   contentRequest: ContentRequest;
   agentId: string;
   contentId: string;
   keywords: string[];
}

export interface ContentWritingJobResult {
   draft: string;
   contentRequest: ContentRequest;
   agentId: string;
   contentId: string;
   userId: string;
}

import { enqueueContentEditingJob } from "./content-editing-queue";
import { runWriteContentDraft } from "../../functions/writing/write-content-draft";
import { registerGracefulShutdown } from "../../helpers";

export async function runContentWriting(
   payload: ContentWritingJobData,
): Promise<ContentWritingJobResult> {
   const {
      contentRequest,
      keywords,
      brandDocument,
      searchSources,
      userId,
      webSearchContent,
      agentId,
      contentId,
   } = payload;
   try {
      // Update status to writing
      await updateContentStatus({
         contentId,
         status: "writing",
      });

      const { draft } = await runWriteContentDraft({
         data: {
            brandDocument,
            webSearchContent,
            contentRequest,
         },
         userId,
      });
      const jobResult = { draft, contentRequest, agentId, contentId, userId };
      await enqueueContentEditingJob({
         keywords,
         searchSources,
         agentId,
         contentId,
         contentRequest,
         draft,
         userId,
      });
      return jobResult;
   } catch (error) {
      console.error("[ContentWriting] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-writing-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentWritingQueue = new Queue<ContentWritingJobData>(
   QUEUE_NAME,
   {
      connection: redis,
   },
);
registerGracefulShutdown(contentWritingQueue);

export async function enqueueContentWritingJob(
   data: ContentWritingJobData,
   jobOptions?: Parameters<Queue<ContentWritingJobData>["add"]>[2],
) {
   return contentWritingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const contentWritingWorker = new Worker<ContentWritingJobData>(
   QUEUE_NAME,
   async (job: Job<ContentWritingJobData>) => {
      await runContentWriting(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentWritingWorker);
