import { Worker, Queue, type Job } from "bullmq";
import type {
   ContentMeta,
   ContentRequest,
   ContentStats,
} from "@packages/database/schema";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../../helpers";
import { runAnalyzeContent } from "../../functions/post-processing/get-content-metadata";
import {
   countWords,
   createSlug,
   extractTitleFromMarkdown,
   readTimeMinutes,
   removeTitleFromMarkdown,
} from "@packages/helpers/text";
import { runSaveContent } from "../../functions/database/save-content";

export interface ContentPostProcessingJobData {
   agentId: string;
   keywords: string[];
   searchSources: string[];
   contentId: string;
   userId: string;
   contentRequest: ContentRequest;
   editedDraft: string;
}

export async function runContentPostProcessing(
   payload: ContentPostProcessingJobData,
) {
   const { agentId, contentId, userId, editedDraft, searchSources, keywords } =
      payload;
   try {
      const { description, qualityScore } = await runAnalyzeContent({
         content: editedDraft,
         userId,
      });
      const title = extractTitleFromMarkdown(editedDraft);
      const finalContent = removeTitleFromMarkdown(editedDraft);
      const metadata = {
         description,
         keywords,
         slug: createSlug(title),
         sources: searchSources,
         title,
      } as ContentMeta;
      const stats = {
         qualityScore,
         readTimeMinutes: readTimeMinutes(countWords(editedDraft)).toString(),
         wordsCount: countWords(editedDraft).toString(),
      } as ContentStats;

      await runSaveContent({
         content: finalContent,
         meta: metadata,
         stats,
         contentId,
      });
   } catch (error) {
      console.error("[ContentPostProcessing] PIPELINE ERROR", {
         agentId,
         contentId,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-post-processing-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentPostProcessingQueue =
   new Queue<ContentPostProcessingJobData>(QUEUE_NAME, {
      connection: redis,
   });
registerGracefulShutdown(contentPostProcessingQueue);

export async function enqueueContentPostProcessingJob(
   data: ContentPostProcessingJobData,
   jobOptions?: Parameters<Queue<ContentPostProcessingJobData>["add"]>[2],
) {
   return contentPostProcessingQueue.add(QUEUE_NAME, data, jobOptions);
}

export const contentPostProcessingWorker =
   new Worker<ContentPostProcessingJobData>(
      QUEUE_NAME,
      async (job: Job<ContentPostProcessingJobData>) => {
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
