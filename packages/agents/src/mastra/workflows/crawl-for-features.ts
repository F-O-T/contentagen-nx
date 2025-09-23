import { createWorkflow, createStep } from "@mastra/core/workflows";
import { createCompetitorKnowledgeWithEmbedding } from "@packages/rag/repositories/competitor-knowledge-repository";
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
// Helper function to update competitor features status and emit server events
async function updateCompetitorFeaturesStatus(
   competitorId: string,
   status: CompetitorFeaturesStatus,
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      await updateCompetitor(db, competitorId, { featuresStatus: status });
   } catch (err) {
      // If DB update fails, still emit event so UI can update
      console.error(
         "[CompetitorFeatures] Failed to update competitor features status in DB:",
         err,
      );
   }
   emitCompetitorFeaturesStatusChanged({ competitorId, status });
}

// Input schema for the workflow
export const CreateCompetitorKnowledgeInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   competitorId: z.string(),
});

// Output schema for the workflow
export const CreateCompetitorKnowledgeOutput = z.object({
   chunkCount: z.number(),
});

const extractCompetitorFeaturesOutputSchema =
   CreateCompetitorKnowledgeInput.extend({
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
         .describe("Array of extracted competitor features"),
   });
const extractCompetitorFeatures = createStep({
   id: "extract-competitor-features-step",
   description: "Extract competitor features using feature extraction agent",
   inputSchema: CreateCompetitorKnowledgeInput,
   outputSchema: extractCompetitorFeaturesOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, competitorId } = inputData;

      await updateCompetitorFeaturesStatus(competitorId, "analyzing");

      const inputPrompt = `
I need you to analyze this competitor website and extract all their features.
websiteUrl: ${websiteUrl}
userId: ${userId}

Requirements:
- Use the tavilyCrawlTool to extract content from the website
- Use tavilySearchTool only if needed to gather more information
- Extract specific features with high confidence (0.7+)
- Categorize features appropriately
- Include source URLs for each feature
- Focus on core functionality, not marketing content
- Extract minimum 10-15 quality features

Return the features in the structured format according to the competitor feature schema.
`;

      const result = await featureExtractionAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: extractCompetitorFeaturesOutputSchema.pick({
               extractedFeatures: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);
      if (!result?.object) {
         throw new Error(
            `Failed to extract competitor features: featureExtractionAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { extractedFeatures } = result.object;
      await updateCompetitorFeaturesStatus(competitorId, "analyzing");

      return {
         extractedFeatures,
         userId,
         websiteUrl,
         competitorId,
      };
   },
});

const saveCompetitorFeatures = createStep({
   id: "save-competitor-features-step",
   description: "Save competitor features to database and index them",
   inputSchema: extractCompetitorFeaturesOutputSchema,
   outputSchema: CreateCompetitorKnowledgeOutput,
   execute: async ({ inputData }) => {
      const { extractedFeatures, competitorId } = inputData;

      // Update status to chunking (processing and indexing)
      await updateCompetitorFeaturesStatus(competitorId, "analyzing");

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      const ragClient = createPgVector({
         pgVectorURL: serverEnv.PG_VECTOR_URL,
      });

      const featuresForDb = extractedFeatures.map((feature) => ({
         competitorId,
         featureName: feature.name,
         summary: feature.summary,
         rawContent: feature.rawContent,
         sourceUrl: feature.sourceUrl,
         meta: {
            confidence: feature.confidence,
            category: feature.category,
            tags: feature.tags,
         },
      }));

      const features = await bulkCreateFeatures(db, featuresForDb);

      if (features.length > 0) {
         try {
            //TODO: create a method to handle this in bulk
            features.forEach(async (feature) => {
               await createCompetitorKnowledgeWithEmbedding(ragClient, {
                  chunk: feature.summary,
                  externalId: competitorId,
                  sourceId: feature.id,
                  type: "feature",
               });
            });

            console.log(
               `[saveCompetitorFeatures] Successfully indexed ${features.length} features to Chroma`,
            );
         } catch (error) {
            console.error(
               "[saveCompetitorFeatures] Error saving features to Chroma:",
               error,
            );
            throw error;
         }
      }

      // Update status to completed
      await updateCompetitorFeaturesStatus(competitorId, "completed");

      return {
         chunkCount: features.length,
      };
   },
});

export const crawlCompetitorForFeatures = createWorkflow({
   id: "crawl-for-competitor-features",
   description: "Extract competitor features and index them",
   inputSchema: CreateCompetitorKnowledgeInput,
   outputSchema: CreateCompetitorKnowledgeOutput,
})
   .then(extractCompetitorFeatures)
   .then(saveCompetitorFeatures)
   .commit();
