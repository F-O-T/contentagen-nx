import { Worker, Queue, type Job } from "bullmq";
import { emitContentStatusChanged } from "@packages/server-events";
import { runFetchAgent } from "../functions/fetch-agent";
import { runGenerateContent } from "../functions/generate-content";
import { runSaveContent } from "../functions/save-content";
import type { ContentRequest } from "@packages/database/schema";
import { runWebSearch } from "../functions/web-search";
import { runAnalyzeContent } from "../functions/generate-content-metadata";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";
import { runHeadlineKeywordExtractor } from "../functions/headline-keyword-extractor";
import { runRagByKeywords } from "../functions/rag-by-keywords";
import { runGenerateBrandDocument } from "../functions/generate-brand-document";
import { removeTitleFromMarkdown } from "@packages/helpers/text";

export async function runContentGeneration(payload: {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}) {
   const { agentId, contentId, contentRequest } = payload;
   if (!contentRequest.description) {
      console.error(
         "[ContentGeneration] ERROR: Content request description is empty",
         {
            agentId,
            contentId,
            contentRequest,
         },
      );
      throw new Error("Content request description is empty");
   }
   try {
      const { agent } = await runFetchAgent({ agentId });
      const userId = agent?.userId;
      if (!agent) throw new Error("Failed to fetch agent");
      const { keywords } = await runHeadlineKeywordExtractor({
         inputText: contentRequest.description,
         userId,
      });
      if (!agent.personaConfig.purpose) {
         console.error(
            "[ContentGeneration] ERROR: Agent persona config purpose is not set",
            { agentId, contentId, personaConfig: agent.personaConfig },
         );
         throw new Error("Agent persona config purpose is not set");
      }
      const rag = await runRagByKeywords({
         agentId: agent.id,
         keywords,
      });
      const [brandDocumentResult, searchResultResult] = await Promise.all([
         runGenerateBrandDocument({
            chunks: rag.chunks,
            userId,
            description: contentRequest.description,
         }),
         runWebSearch({
            query: Array.isArray(keywords) ? keywords.join(" ") : keywords,
            userId,
         }),
      ]);
      const { brandDocument } = brandDocumentResult;
      const { searchResult } = searchResultResult;

      const { content } = await runGenerateContent({
         agent,
         brandDocument,
         webSearchContent: searchResult.results
            .map((r) => r.content || "")
            .join("\n\n"),
         userId,
         contentRequest,
      });
      if (!content) {
         console.error(
            "[ContentGeneration] ERROR: Failed to generate content",
            { agentId, contentId, content },
         );
         throw new Error("Failed to generate content");
      }

      console.info("[ContentGeneration] START: Analyzing content metadata", {
         agentId,
         contentId,
      });
      const contentMetadata = await runAnalyzeContent({
         content,
         userId,
         keywords,
         sources: searchResult.results.map((result) => result.url),
      });
      console.info("[ContentGeneration] END: Analyzing content metadata", {
         agentId,
         contentId,
         hasMetadata: !!(contentMetadata?.meta && contentMetadata?.stats),
      });
      if (!contentMetadata?.meta || !contentMetadata?.stats) {
         console.error(
            "[ContentGeneration] ERROR: Failed to analyze content metadata",
            { agentId, contentId, contentMetadata },
         );
         throw new Error("Failed to analyze content metadata");
      }
      const metadata = contentMetadata;
      console.info("[ContentGeneration] START: Saving content", {
         agentId,
         contentId,
      });
      const saveResult = await runSaveContent({
         meta: metadata.meta,
         stats: metadata.stats,
         contentId,
         content: removeTitleFromMarkdown(content),
      });
      console.info("[ContentGeneration] END: Saving content", {
         agentId,
         contentId,
         saveSuccess: !!saveResult,
      });
      if (!saveResult) {
         console.error("[ContentGeneration] ERROR: Failed to save content", {
            agentId,
            contentId,
         });
         throw new Error("Failed to save content");
      }
      // Emit event to signal content status changed to draft
      emitContentStatusChanged({
         contentId,
         status: "draft",
      });
      return saveResult;
   } catch (error) {
      console.error("[ContentGeneration] PIPELINE ERROR", {
         agentId,
         contentId,
         contentRequest,
         error: error instanceof Error ? error.message : error,
         stack: error instanceof Error && error.stack ? error.stack : undefined,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentGenerationQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});
registerGracefulShutdown(contentGenerationQueue);

export const contentGenerationWorker = new Worker(
   QUEUE_NAME,
   async (
      job: Job<{
         agentId: string;
         contentId: string;
         contentRequest: ContentRequest;
      }>,
   ) => {
      await runContentGeneration(job.data);
   },
   {
      connection: redis,
      removeOnComplete: {
         count: 10,
      },
   },
);
registerGracefulShutdown(contentGenerationWorker);
