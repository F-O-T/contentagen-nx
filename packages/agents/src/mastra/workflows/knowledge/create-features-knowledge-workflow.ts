import { createWorkflow, createStep } from "@mastra/core/workflows";
import { createCompetitorKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/competitor-knowledge-repository";
import { createBrandKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/brand-knowledge-repository";
import { createPgVector } from "@packages/rag/client";
import { bulkCreateFeatures } from "@packages/database/repositories/competitor-feature-repository";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { featureExtractionAgent } from "../agents/feature-extractor-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { emitCompetitorFeaturesStatusChanged } from "@packages/server-events";
import { z } from "zod";
import type { CompetitorFeaturesStatus } from "@packages/database/schemas/competitor";
import { AppError, propagateError } from "@packages/utils/errors";

type LLMUsage = {
   inputTokens: number;
   outputTokens: number;
   totalTokens: number;
   reasoningTokens?: number | null;
   cachedInputTokens?: number | null;
};

async function ingestUsage(usage: LLMUsage, userId: string) {
   const paymentClient = getPaymentClient(serverEnv.POLAR_ACCESS_TOKEN);
   const usageMetadata = createAiUsageMetadata({
      effort: "deepseek-v3.1-terminus",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}

// Helper function to update target features status and emit server events
async function updateTargetFeaturesStatus(
   targetId: string,
   target: "brand" | "competitor",
   status: CompetitorFeaturesStatus,
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      if (target === "competitor") {
         await updateCompetitor(db, targetId, { featuresStatus: status });
      }
      // TODO: Implement brand features status updates when brand repository is available
   } catch (err) {
      // If DB update fails, still emit event for competitor so UI can update
      console.error(
         `[KnowledgeFeatures] Failed to update ${target} features status in DB:`,
         err,
      );
      propagateError(err);
      throw AppError.internal(`Failed to update ${target} features status`);
   }

   if (target === "competitor") {
      emitCompetitorFeaturesStatusChanged({ competitorId: targetId, status });
   }
   // TODO: Implement brand events when brand event system is available
}

// Input schema for the workflow
export const CreateKnowledgeFeaturesInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   targetId: z.string(),
   target: z.enum(["brand", "competitor"]),
});

// Output schema for the workflow
export const CreateKnowledgeFeaturesOutput = z.object({
   chunkCount: z.number(),
});

const extractKnowledgeFeaturesOutputSchema =
   CreateKnowledgeFeaturesInput.extend({
      extractedFeatures: z
         .array(
            z.object({
               name: z.string().describe("Clear, concise name for the feature"),
               summary: z
                  .string()
                  .describe("Brief description of what the feature does"),
               category: z
                  .string()
                  .describe(
                     "Type of feature (e.g., 'User Interface', 'Analytics', 'Integration', etc.)",
                  ),
               confidence: z
                  .number()
                  .min(0)
                  .max(1)
                  .describe(
                     "Confidence level that this is a real feature (0-1)",
                  ),
               tags: z
                  .array(z.string())
                  .describe("Relevant keywords or tags for this feature"),
               rawContent: z
                  .string()
                  .describe("The relevant text that describes this feature"),
               sourceUrl: z
                  .string()
                  .describe("URL where this feature was found"),
            }),
         )
         .describe("Array of extracted features from target"),
   });

const extractKnowledgeFeatures = createStep({
   id: "extract-knowledge-features-step",
   description: "Extract features from target website using feature extraction agent with improved target support",
   inputSchema: CreateKnowledgeFeaturesInput,
   outputSchema: extractKnowledgeFeaturesOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, targetId, target } = inputData;

      await updateTargetFeaturesStatus(targetId, target, "analyzing");

      const inputPrompt = `
I need you to analyze this ${target} website and extract all their features.
websiteUrl: ${websiteUrl}
userId: ${userId}
target: ${target}
targetId: ${targetId}

Requirements:
- Use the tavilyCrawlTool to extract content from the website
- Use tavilySearchTool only if needed to gather more information
- Extract specific features with high confidence (0.7+)
- Categorize features appropriately
- Include source URLs for each feature
- Focus on core functionality, not marketing content
- Extract minimum 10-15 quality features
- Adapt extraction strategy based on target type (brand vs competitor)
- For brands, focus on product features and capabilities
- For competitors, focus on competitive features and differentiators

Return the features in the structured format according to the feature extraction schema.
`;

      const result = await featureExtractionAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: extractKnowledgeFeaturesOutputSchema.pick({
               extractedFeatures: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to extract ${target} features: featureExtractionAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { extractedFeatures } = result.object;
      await updateTargetFeaturesStatus(targetId, target, "analyzing");

      return {
         extractedFeatures,
         userId,
         websiteUrl,
         targetId,
         target,
      };
   },
});

const saveKnowledgeFeatures = createStep({
   id: "save-knowledge-features-step",
   description: "Save features to database and index them with improved target handling",
   inputSchema: extractKnowledgeFeaturesOutputSchema,
   outputSchema: CreateKnowledgeFeaturesOutput,
   execute: async ({ inputData }) => {
      const { extractedFeatures, targetId, target } = inputData;

      // Update status to chunking (processing and indexing)
      await updateTargetFeaturesStatus(targetId, target, "analyzing");

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const ragClient = createPgVector({
         pgVectorURL: serverEnv.PG_VECTOR_URL,
      });

      const featuresForDb = extractedFeatures.map((feature) => ({
         ...(target === "competitor" ? { competitorId: targetId } : { brandId: targetId }),
         featureName: feature.name,
         summary: feature.summary,
         rawContent: feature.rawContent,
         sourceUrl: feature.sourceUrl,
         meta: {
            confidence: feature.confidence,
            category: feature.category,
            tags: feature.tags,
            target,
         },
      }));

      let features = [];

      if (target === "competitor") {
         features = await bulkCreateFeatures(db, featuresForDb);
      } else {
         // TODO: Implement brand features creation when brand feature repository is available
         console.log(`[saveKnowledgeFeatures] Brand features saving not yet implemented`);
         // For now, create mock features for processing
         features = featuresForDb.map((f, index) => ({
            id: crypto.randomUUID(),
            ...f
         }));
      }

      if (features.length > 0) {
         try {
            console.log(
               `[saveKnowledgeFeatures] Creating embeddings for ${features.length} ${target} features`,
            );

            const knowledgeData = features.map((feature) => ({
               chunk: feature.summary,
               externalId: targetId,
               sourceId: feature.id,
               type: "feature" as const,
               target,
            }));

            if (target === "competitor") {
               await createCompetitorKnowledgeWithEmbeddingsBulk(
                  ragClient,
                  knowledgeData,
               );
            } else {
               await createBrandKnowledgeWithEmbeddingsBulk(
                  ragClient,
                  knowledgeData,
               );
            }

            console.log(
               `[saveKnowledgeFeatures] Successfully indexed ${features.length} ${target} features to vector database`,
            );
         } catch (error) {
            console.error(
               `[saveKnowledgeFeatures] Error saving ${target} features to vector database:`,
               error,
            );
            propagateError(error);
            throw AppError.internal(
               `Failed to save ${target} features to vector database`,
            );
         }
      }

      // Update status to completed
      await updateTargetFeaturesStatus(targetId, target, "completed");

      return {
         chunkCount: features.length,
      };
   },
});

export const createKnowledgeFeaturesWorkflow = createWorkflow({
   id: "create-knowledge-features",
   description: "Extract features from target and index them with improved target support",
   inputSchema: CreateKnowledgeFeaturesInput,
   outputSchema: CreateKnowledgeFeaturesOutput,
})
   .then(extractKnowledgeFeatures)
   .then(saveKnowledgeFeatures)
   .commit();