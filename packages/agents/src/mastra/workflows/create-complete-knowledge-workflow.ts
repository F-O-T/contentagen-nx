import { createWorkflow } from "@mastra/core/workflows";
import { z } from "zod";
import { createOverviewWorkflow } from "./knowledge/create-overview-workflow";
import { createFeaturesKnowledgeWorkflow } from "./knowledge/create-features-knowledge-workflow";
import { createKnowledgeAndIndexDocumentsWorkflow } from "./knowledge/create-knowledge-and-index-documents-workflow";

export const CreateCompleteKnowledgeInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
});

export const CreateCompleteKnowledgeOutput = z.object({
   "create-overview": z.object({
      chunkCount: z.number(),
   }),
   "create-features-knowledge": z.object({
      chunkCount: z.number(),
   }),
   "create-knowledge-and-index-documents": z.object({
      chunkCount: z.number(),
   }),
});

export const createCompleteKnowledgeWorkflow = createWorkflow({
   id: "create-complete-knowledge",
   description: "Run all knowledge workflows in parallel",
   inputSchema: CreateCompleteKnowledgeInput,
   outputSchema: CreateCompleteKnowledgeOutput,
})
   .parallel([
      createOverviewWorkflow,
      createFeaturesKnowledgeWorkflow,
      createKnowledgeAndIndexDocumentsWorkflow,
   ])
   .commit();

