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

export async function runContentGeneration(payload: {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}) {
   const { agentId, contentId, contentRequest } = payload;
   try {
      console.info("Pipeline: Fetching agent", { agentId });
      const agentResult = await runFetchAgent({ agentId });
      if (!agentResult || !agentResult.agent)
         throw new Error("Failed to fetch agent");
      const agent = agentResult.agent;

      // Step: Improve description using RAG
      console.info("Pipeline: Improving description with RAG", { agentId });
      if (
         !contentRequest.description ||
         contentRequest.description.trim() === ""
      ) {
         throw new Error("Content request description is empty");
      }
      if (!agent.personaConfig.purpose) {
         throw new Error("Agent persona config purpose is not set");
      }
      const ragResult = await runKnowledgeChunkRag({
         agentId,
         purpose: agent.personaConfig.purpose,
         description: contentRequest.description,
      });
      if (!ragResult || !ragResult.improvedDescription)
         throw new Error("Failed to improve description with RAG");

      const webSearch = await runWebSearch({
         query: payload.contentRequest.description,
      });
      if (!webSearch || !webSearch.allContent) {
         throw new Error("Failed to perform web search");
      }

      console.info("Pipeline: Generating content", { agentId });
      const contentResult = await runGenerateContent({
         agent,
         brandDocument: ragResult.improvedDescription,
         webSearchContent: webSearch.allContent,
         contentRequest: {
            description: payload.contentRequest.description,
         },
      });
      if (!contentResult || !contentResult.content)
         throw new Error("Failed to generate content");
      const content = contentResult.content;

      const contentMetadata = await runAnalyzeContent({ content });
      if (!contentMetadata || !contentMetadata.meta || !contentMetadata.stats) {
         throw new Error("Failed to analyze content metadata");
      }
      const metadata = contentMetadata;
      console.info("Pipeline: Saving content", { contentId });
      const saveResult = await runSaveContent({
         meta: metadata.meta,
         stats: metadata.stats,
         contentId,
         content,
      });
      if (!saveResult) throw new Error("Failed to save content");
      return saveResult;
   } catch (error) {
      console.error("Error in content generation pipeline", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

const QUEUE_NAME = "content-generation-workflow";
const redis = createRedisClient(serverEnv.REDIS_URL);

export const contentGenerationQueue = new Queue(QUEUE_NAME, {
   connection: redis,
});

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
   },
);
