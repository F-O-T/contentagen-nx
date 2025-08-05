import { batch, task } from "@trigger.dev/sdk/v3";
import { crawlWebsiteForBrandKnowledgeTask } from "../trigger/crawl-website-for-brand-knowledge";
import { createBrandDocumentTask } from "../trigger/create-brand-document";
import { chunkBrandDocumentTask } from "../trigger/chunk-brand-document";
import { uploadBrandChunksTask } from "../trigger/upload-brand-chunks";

import type { knowledgeDistillationTask } from "./knowledge-distillation";
// batch trigger is used for distillation step

interface AutoBrandKnowledgePayload {
   agentId: string;
   userId: string;
   websiteUrl: string;
}

export async function runAutoBrandKnowledge(
   payload: AutoBrandKnowledgePayload,
) {
   const { agentId, websiteUrl } = payload;
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

   // === Begin: Upload chunks and trigger distillation in batch ===
   const chunks = (chunkBrandDocument.output.chunks || []).filter(Boolean);

   // Upload all chunks using the new trigger
   const uploadResult = await uploadBrandChunksTask.triggerAndWait({
      agentId,
      chunks,
   });
   if (!uploadResult.ok) {
      throw new Error("Failed to upload brand chunks");
   }
   const uploadedFiles = uploadResult.output.uploadedFiles;

   // Batch trigger knowledge distillation for all uploaded files/chunks
   await batch.trigger<typeof knowledgeDistillationTask>(
      uploadedFiles.map((file) => ({
         id: "knowledge-distillation-job",
         payload: {
            inputText: file.rawContent,
            agentId,
            sourceId: file.fileUrl,
         },
      })),
   ); // === End: Upload chunks and trigger distillation in batch ===

   // === End: Generate .md files, upload to MinIO, update agent, trigger distillation ===
}

export const autoBrandKnowledgeTask = task({
   id: "auto-brand-knowledge-workflow",
   run: runAutoBrandKnowledge,
});
