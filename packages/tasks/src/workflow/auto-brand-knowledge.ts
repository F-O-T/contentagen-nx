import { task } from "@trigger.dev/sdk/v3";
import { crawlWebsiteForBrandKnowledgeTask } from "../trigger/crawl-website-for-brand-knowledge";
import { createBrandDocumentTask } from "../trigger/create-brand-document";
import { chunkBrandDocumentTask } from "../trigger/chunk-brand-document";

interface AutoBrandKnowledgePayload {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

export async function runAutoBrandKnowledge(
   payload: AutoBrandKnowledgePayload,
) {
   const { agentId, userId, websiteUrl } = payload;

   const crawlResult = await crawlWebsiteForBrandKnowledgeTask.triggerAndWait({
      websiteUrl,
   });
   if (!crawlResult.ok) {
      throw new Error("Failed to crawl the website for brand knowledge");
   }

   const brandDocument = await createBrandDocumentTask.triggerAndWait({
      rawText: crawlResult.output.allContent,
   });
   if (!brandDocument.ok) {
      throw new Error("Failed to create brand document");
   }

   const chunkBrandDocument = await chunkBrandDocumentTask.triggerAndWait({
      inputText: brandDocument.output.content,
   });
   if (!chunkBrandDocument.ok) {
      throw new Error("Failed to chunk brand document");
   }
}

export const autoBrandKnowledgeTask = task({
   id: "auto-brand-knowledge-workflow",
   run: runAutoBrandKnowledge,
});
