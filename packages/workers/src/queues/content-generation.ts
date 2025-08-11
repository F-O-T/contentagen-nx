import { Worker, Queue, type Job } from "bullmq";
import { runFetchAgent } from "../functions/fetch-agent";
import { runGenerateContent } from "../functions/generate-content";
import { runKnowledgeChunkRag } from "../functions/knowledge-chunk-rag";
import { runSaveContent } from "../functions/save-content";
import type { ContentRequest } from "@packages/database/schema";
import { runWebSearch } from "../functions/web-search";
import { runAnalyzeContent } from "../functions/generate-content-metadata";
import { serverEnv } from "@packages/environment/server";
import { createRedisClient } from "@packages/redis";
import { registerGracefulShutdown } from "../helpers";

export async function runContentGeneration(payload: {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}) {
   const { agentId, contentId, contentRequest } = payload;
   try {
      console.info("[ContentGeneration] START: Fetching agent", {
         agentId,
         contentId,
      });
      const agentResult = await runFetchAgent({ agentId });
      const userId = agentResult?.agent?.userId;
      console.info("[ContentGeneration] END: Fetching agent", {
         agentId,
         contentId,
         agentFound: !!agentResult?.agent,
      });
      if (!agentResult?.agent) throw new Error("Failed to fetch agent");
      const agent = agentResult.agent;

      // Step: Improve description using RAG
      console.info(
         "[ContentGeneration] START: Improving description with RAG",
         { agentId, contentId },
      );
      if (
         !contentRequest.description ||
         contentRequest.description.trim() === ""
      ) {
         console.error(
            "[ContentGeneration] ERROR: Content request description is empty",
            { agentId, contentId, contentRequest },
         );
         throw new Error("Content request description is empty");
      }
      if (!agent.personaConfig.purpose) {
         console.error(
            "[ContentGeneration] ERROR: Agent persona config purpose is not set",
            { agentId, contentId, personaConfig: agent.personaConfig },
         );
         throw new Error("Agent persona config purpose is not set");
      }
      const ragResult = await runKnowledgeChunkRag({
         agentId,
         purpose: agent.personaConfig.purpose,
         description: contentRequest.description,
      });
      console.info("[ContentGeneration] END: Improving description with RAG", {
         agentId,
         contentId,
         improved: !!ragResult?.improvedDescription,
      });
      if (!ragResult?.improvedDescription) {
         console.error(
            "[ContentGeneration] ERROR: Failed to improve description with RAG",
            { agentId, contentId, ragResult },
         );
         throw new Error("Failed to improve description with RAG");
      }

      console.info("[ContentGeneration] START: Performing web search", {
         agentId,
         contentId,
      });
      const webSearch = await runWebSearch({
         query: payload.contentRequest.description,
         userId,
      });
      console.info("[ContentGeneration] END: Performing web search", {
         agentId,
         contentId,
         foundResults: !!webSearch?.allContent,
      });
      if (!webSearch?.allContent) {
         console.error(
            "[ContentGeneration] ERROR: Failed to perform web search",
            { agentId, contentId, webSearch },
         );
         throw new Error("Failed to perform web search");
      }

      console.info("[ContentGeneration] START: Generating content", {
         agentId,
         contentId,
      });
      const contentResult = await runGenerateContent({
         agent,
         brandDocument: ragResult.improvedDescription,
         webSearchContent: webSearch.allContent,
         userId,
         contentRequest: {
            description: payload.contentRequest.description,
         },
      });
      console.info("[ContentGeneration] END: Generating content", {
         agentId,
         contentId,
         contentGenerated: !!contentResult?.content,
      });
      if (!contentResult?.content) {
         console.error(
            "[ContentGeneration] ERROR: Failed to generate content",
            { agentId, contentId, contentResult },
         );
         throw new Error("Failed to generate content");
      }
      const content = contentResult.content;

      console.info("[ContentGeneration] START: Analyzing content metadata", {
         agentId,
         contentId,
      });
      const contentMetadata = await runAnalyzeContent({ content, userId });
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
         content,
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
