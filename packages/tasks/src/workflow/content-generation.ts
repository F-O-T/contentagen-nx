import { task, logger } from "@trigger.dev/sdk/v3";
import { fetchAgentTask } from "../trigger/fetch-agent";
import { generateContentTask } from "../trigger/generate-content";
import { knowledgeChunkRag } from "../trigger/knowledge-chunk-rag";
import { saveContentTask } from "../trigger/save-content";
import type { ContentRequest } from "@packages/database/schema";
import { webSerchTask } from "../trigger/web-search";
import { analyzeContentTask } from "../trigger/generate-content-metadata";

export async function runContentGeneration(payload: {
   agentId: string;
   contentId: string;
   contentRequest: ContentRequest;
}) {
   const { agentId, contentId, contentRequest } = payload;
   try {
      logger.info("Pipeline: Fetching agent", { agentId });
      const agentResult = await fetchAgentTask.triggerAndWait({ agentId });
      if (!agentResult.ok) throw new Error("Failed to fetch agent");
      const agent = agentResult.output.agent;

      // Step: Improve description using RAG
      logger.info("Pipeline: Improving description with RAG", { agentId });
      if (
         !contentRequest.description ||
         contentRequest.description.trim() === ""
      ) {
         throw new Error("Content request description is empty");
      }
      if (!agent.personaConfig.purpose) {
         throw new Error("Agent persona config purpose is not set");
      }
      const ragResult = await knowledgeChunkRag.triggerAndWait({
         agentId,
         purpose: agent.personaConfig.purpose,
         description: contentRequest.description,
      });

      if (!ragResult.ok)
         throw new Error("Failed to improve description with RAG");
      const webSearch = await webSerchTask.triggerAndWait({
         query: payload.contentRequest.description,
      });
      if (!webSearch.ok) {
         throw new Error("Failed to perform web search");
      }
      logger.info("Pipeline: Generating content", { agentId });
      const contentResult = await generateContentTask.triggerAndWait({
         agent,
         brandDocument: ragResult.output.improvedDescription,
         webSearchContent: webSearch.output.allContent,
         contentRequest: {
            description: payload.contentRequest.description,
         },
      });
      if (!contentResult.ok) throw new Error("Failed to generate content");
      const content = contentResult.output.content;
      const contentMetadata = await analyzeContentTask.triggerAndWait({
         content,
      });
      if (!contentMetadata.ok) {
         throw new Error("Failed to analyze content metadata");
      }
      const metadata = contentMetadata.output;
      logger.info("Pipeline: Saving content", { contentId });
      const saveResult = await saveContentTask.triggerAndWait({
         meta: metadata.meta,
         stats: metadata.stats,
         contentId,
         content,
      });
      if (!saveResult.ok) throw new Error("Failed to save content");

      return saveResult.output;
   } catch (error) {
      logger.error("Error in content generation pipeline", {
         error: error instanceof Error ? error.message : error,
      });
      throw error;
   }
}

export const contentGenerationTask = task({
   id: "content-generation-workflow",
   run: runContentGeneration,
});
