import { createWorkflow, createStep } from "@mastra/core/workflows";
import { createCompetitorKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/competitor-knowledge-repository";
import { createBrandKnowledgeWithEmbeddingsBulk } from "@packages/rag/repositories/brand-knowledge-repository";
import { createPgVector } from "@packages/rag/client";
import { bulkCreateFeatures } from "@packages/database/repositories/competitor-feature-repository";
import { featureExtractionAgent } from "../../agents/feature-extractor-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { z } from "zod";
import { AppError, propagateError } from "@packages/utils/errors";
import { ingestUsage, type MastraLLMUsage } from "../../helpers";

export const CreateFeaturesKnowledgeInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
});

// Output schema for the workflow
export const CreateFeaturesKnowledgeOutput = z.object({
   chunkCount: z.number(),
});

const extractFeaturesKnowledgeOutputSchema =
   CreateFeaturesKnowledgeInput.extend({
      extractedFeatures: z
         .array(
            z.object({
               name: z
                  .string()
                  .describe(
                     "Clear, concise name for the feature (e.g., 'Real-time Collaboration', 'API Webhooks', 'Custom Reports')",
                  ),
               summary: z
                  .string()
                  .describe(
                     "1-3 sentence description explaining what users can do with this feature and its primary benefit",
                  ),
               category: z
                  .string()
                  .describe(
                     "Functional category (e.g., 'Collaboration', 'Analytics', 'Integration', 'Security', 'Automation', 'Customization')",
                  ),
               confidence: z
                  .number()
                  .min(0)
                  .max(1)
                  .describe(
                     "Confidence score between 0 and 1 indicating certainty this is a legitimate product feature (0.8+ for clearly documented features, 0.5-0.8 for implied features, below 0.5 for uncertain)",
                  ),
               tags: z
                  .array(z.string())
                  .describe(
                     "3-5 relevant keywords or technology terms associated with this feature for searchability",
                  ),
               rawContent: z
                  .string()
                  .describe(
                     "The original text excerpt from the website that describes this feature, used as source material",
                  ),
               sourceUrl: z
                  .string()
                  .describe(
                     "The specific URL where this feature was documented or mentioned",
                  ),
            }),
         )
         .min(10)
         .describe(
            "Array of extracted features - aim for 15+ distinct, user-facing capabilities",
         ),
   });
const extractFeaturesKnowledge = createStep({
   id: "extract-features-knowledge-step",
   description: "Extract features knowledge from website",
   inputSchema: CreateFeaturesKnowledgeInput,
   outputSchema: extractFeaturesKnowledgeOutputSchema,

   execute: async ({ inputData, runtimeContext }) => {
      const { userId, websiteUrl, id, target } = inputData;

      try {
         const inputPrompt = `Extract software features from: ${websiteUrl}

Focus on user-facing capabilities and actions. Target 15+ features (minimum 10).`;

         const result = await featureExtractionAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: extractFeaturesKnowledgeOutputSchema.pick({
                  extractedFeatures: true,
               }),
            },
         );

         await ingestUsage(result.usage as MastraLLMUsage, userId);
         if (!result?.object.extractedFeatures) {
            throw AppError.validation("No features extracted from competitor");
         }

         const { extractedFeatures } = result.object;

         return {
            extractedFeatures,
            userId,
            websiteUrl,
            id,
            target,
         };
      } catch (err) {
         console.error("failed to extract features knowledge for url", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to extract features knowledge from competitor website",
         );
      }
   },
});

const saveCompetitorFeaturesKnowledge = createStep({
   id: "save-competitor-features-knowledge-step",
   description:
      "Save competitor features knowledge to database and create embeddings",
   inputSchema: extractFeaturesKnowledgeOutputSchema,
   outputSchema: CreateFeaturesKnowledgeOutput,
   execute: async ({ inputData }) => {
      const { extractedFeatures, id } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });

         if (!extractedFeatures || extractedFeatures.length === 0) {
            throw AppError.validation("No features provided for saving");
         }

         const featuresForDb = extractedFeatures.map((feature) => ({
            competitorId: id,
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

         if (features.length === 0) {
            throw AppError.internal("No features were created in the database");
         }

         const knowledgeData = features.map((feature) => ({
            chunk: feature.summary,
            externalId: id,
            sourceId: feature.id,
            type: "feature" as const,
         }));

         await createCompetitorKnowledgeWithEmbeddingsBulk(
            ragClient,
            knowledgeData,
         );

         return {
            chunkCount: features.length,
         };
      } catch (err) {
         console.error("failed to save competitor features", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to save competitor features knowledge to database and vector store",
         );
      }
   },
});

const saveBrandFeaturesKnowledge = createStep({
   id: "save-brand-features-knowledge-step",
   description: "Save brand features knowledge to vector database",
   inputSchema: extractFeaturesKnowledgeOutputSchema,
   outputSchema: CreateFeaturesKnowledgeOutput,
   execute: async ({ inputData }) => {
      const { extractedFeatures, id } = inputData;
      //TODO: Finish the implementation when the new organizaiton is done
      try {
         const ragClient = createPgVector({
            pgVectorURL: serverEnv.PG_VECTOR_URL,
         });

         if (!extractedFeatures || extractedFeatures.length === 0) {
            throw AppError.validation("No features provided for saving");
         }

         // For brand, we directly create embeddings without storing in database
         const knowledgeData = extractedFeatures.map((feature, index) => ({
            chunk: feature.summary,
            externalId: id,
            sourceId: `brand-feature-${index}`,
            type: "feature" as const,
         }));

         await createBrandKnowledgeWithEmbeddingsBulk(ragClient, knowledgeData);

         return {
            chunkCount: extractedFeatures.length,
         };
      } catch (err) {
         console.error("failed to save brand features", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to save brand features knowledge to vector database",
         );
      }
   },
});

export const createFeaturesKnowledgeWorkflow = createWorkflow({
   id: "create-features-knowledge",
   description: "Create features knowledge from analysis",
   inputSchema: CreateFeaturesKnowledgeInput,
   outputSchema: CreateFeaturesKnowledgeOutput,
})
   .then(extractFeaturesKnowledge)
   .branch([
      [
         async ({ inputData: { target } }) => target === "competitor",
         saveCompetitorFeaturesKnowledge,
      ],
      [
         async ({ inputData: { target } }) => target === "brand",
         saveBrandFeaturesKnowledge,
      ],
   ])
   .commit();
