import { task, logger } from "@trigger.dev/sdk/v3";
import {
   getContentById,
   updateContent,
} from "@packages/database/repositories/content-repository";
import { getAgentById } from "@packages/database/repositories/agent-repository";
import { createDb } from "@packages/database/client";
import { serverEnv } from "@packages/environment/server";
import { createOpenrouterClient } from "@packages/openrouter/client";
import { generateOpenRouterText } from "@packages/openrouter/helpers";

const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
const openrouter = createOpenrouterClient(serverEnv.OPENROUTER_API_KEY);

export type ContentGenerationPayload = {
   contentId: string;
   agentId: string;
};

export async function runContentGenerationPipeline(
   payload: ContentGenerationPayload,
) {
   const { contentId, agentId } = payload;
   logger.info("Starting simplified content generation pipeline", {
      contentId,
      agentId,
   });

   const content = await getContentById(db, contentId);
   const agent = await getAgentById(db, agentId);
   if (!content || !agent) {
      throw new Error("Content or Agent not found");
   }

   console.log(content.request.description);
   // Article Generation
   const systemPrompt = agent.systemPrompt;
   const writerPrompt = `Write a full article based on the following description:\n${content.request.description}`;
   const writerResult = await generateOpenRouterText(openrouter, {
      system: systemPrompt,
      prompt: writerPrompt,
   });
   const generatedArticle = writerResult.text;

   // Metadata Generation
   const metaPrompt = `Generate metadata for the following article.\nReturn ONLY valid JSON. Do NOT include any Markdown, code fences, or explanations.\nYour response must be a single JSON object matching this schema:\n{\n  \"slug\": string,\n  \"tags\": string[],\n  \"topics\": string[],\n  \"sources\": string[]\n}\n\nArticle:\n${generatedArticle}`;
   const metaResultRaw = await generateOpenRouterText(openrouter, {
      prompt: metaPrompt,
   });
   console.log("Metadata generation result", {
      text: metaResultRaw.text,
      usage: metaResultRaw.usage,
   });
   let metaResult;
   try {
      metaResult = JSON.parse(metaResultRaw.text);
   } catch (e) {
      logger.error("Failed to parse metadata JSON", {
         error: e,
         text: metaResultRaw.text,
      });
      throw new Error("Metadata generation failed: invalid format");
   }
   const contentMeta = metaResult.metadata || metaResult;

   // Update DB with final content and metadata
   await updateContent(db, contentId, {
      body: generatedArticle,
      meta: contentMeta,
      status: "draft",
   });
   logger.info("Simplified content generation pipeline complete", {
      contentId,
   });
   return { content, agent, generatedArticle, contentMeta };
}

export const contentGenerationTask = task({
   id: "content-generation-pipeline",
   run: runContentGenerationPipeline,
});
