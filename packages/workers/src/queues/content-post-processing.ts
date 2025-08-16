import { Worker, Queue, type Job } from "bullmq";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { emitContentStatusChanged } from "@packages/server-events";
import { removeTitleFromMarkdown } from "@packages/helpers/text";
import type { ContentRequest } from "@packages/database/schema";
import { runAnalyzeContent } from "../functions/generate-content-metadata";
import { runSaveContent } from "../functions/save-content";

export async function runContentPostProcessing(payload: {
   agentId: string;
   contentId: string;
   userId: string;
   content: string;
   keywords: string[];
   sources: string[];
   contentRequest: ContentRequest;
}) {
   const {
      agentId,
      contentId,
      userId,
      content,
      keywords,
      sources,
      contentRequest,
   } = payload;
   try {
      console.info(
         "[ContentPostProcessing] START: Analyzing content metadata",
         {
            agentId,
            contentId,
         },
      );
      const contentMetadata = await runAnalyzeContent({
         content,
         userId,
         keywords,
         sources,
      });
      console.info("[ContentPostProcessing] END: Analyzing content metadata", {
         agentId,
         contentId,
         hasMetadata: !!(contentMetadata?.meta && contentMetadata?.stats),
      });
      if (!contentMetadata?.meta || !contentMetadata?.stats) {
         console.error(
            "[ContentPostProcessing] ERROR: Failed to analyze content metadata",
            { agentId, contentId, contentMetadata },
         );
         throw new Error("Failed to analyze content metadata");
      }
      const metadata = contentMetadata;
      console.info("[ContentPostProcessing] START: Saving content", {
         agentId,
         contentId,
      });
      const saveResult = await runSaveContent({
         meta: metadata.meta,
         stats: metadata.stats,
         contentId,
         content: removeTitleFromMarkdown(content),
      });
      console.info("[ContentPostProcessing] END: Saving content", {
         agentId,
         contentId,
         saveSuccess: !!saveResult,
      });
      if (!saveResult) {
         console.error(
            "[ContentPostProcessing] ERROR: Failed to save content",
            {
               agentId,
               contentId,
            },
         );
         throw new Error("Failed to save content");
      }
      // Emit event to signal content status changed to draft
      emitContentStatusChanged({
         contentId,
         status: "draft",
      });
      return saveResult;
   } catch (error) {
      console.error("[ContentPostProcessing] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

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
