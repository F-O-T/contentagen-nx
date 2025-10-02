import { createWorkflow, createStep } from "@mastra/core/workflows";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import { companyInfoExtractorAgent } from "../agents/company-info-extractor-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import crypto from "node:crypto";
import { z } from "zod";
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

// Helper function to update target analysis status
async function updateTargetAnalysisStatus(
   targetId: string,
   target: "brand" | "competitor",
   status: "pending" | "analyzing" | "chunking" | "completed" | "failed",
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      if (target === "competitor") {
         await updateCompetitor(db, targetId, { analysisStatus: status });
      }
      // TODO: Implement brand status updates when brand repository is available
   } catch (err) {
      console.error(
         `[KnowledgeBrand] Failed to update ${target} analysis status in DB:`,
         err,
      );
      propagateError(err);
      throw AppError.internal(`Failed to update ${target} analysis status`);
   }
}

// Input schema for the workflow
export const ExtractKnowledgeBrandInfoInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   targetId: z.string(),
   target: z.enum(["brand", "competitor"]),
});

// Output schema for the workflow
export const ExtractKnowledgeBrandInfoOutput = z.object({
   companyInfoId: z.string(),
   chunkCount: z.number(),
   savedLogoPath: z.string().optional(),
});

const extractKnowledgeBrandInfoOutputSchema =
   ExtractKnowledgeBrandInfoInput.extend({
      companyInfo: z.object({
         companyName: z.string().describe("Official company/brand name"),
         description: z
            .string()
            .describe("Concise 1-2 sentence company description"),
         detailedSummary: z
            .string()
            .describe("Comprehensive 3-5 paragraph company summary"),
         extractionConfidence: z
            .number()
            .min(0)
            .max(1)
            .describe(
               "Overall confidence score for extracted information (0-1)",
            ),
      }),
   });

const extractKnowledgeBrandInfo = createStep({
   id: "extract-knowledge-brand-info-step",
   description:
      "Extract brand/competitor information using company info extractor agent with improved target support",
   inputSchema: ExtractKnowledgeBrandInfoInput,
   outputSchema: extractKnowledgeBrandInfoOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, targetId, target } = inputData;

      await updateTargetAnalysisStatus(targetId, target, "analyzing");

      const inputPrompt = `
I need you to analyze this ${target} website and extract comprehensive company information.
websiteUrl: ${websiteUrl}
userId: ${userId}
target: ${target}
targetId: ${targetId}

Requirements:
- Use the tavilyCrawlTool to extract content from the website
- Use tavilySearchTool only if needed to gather more company information
- Extract the company name, description, and detailed summary
- Focus on company information, not product features
- Ensure high confidence scores for all extracted information
- Provide comprehensive company background and details
- Adapt extraction strategy based on target type (brand vs competitor)

Return the company information in the structured format according to the company info extraction schema.
`;

      const result = await companyInfoExtractorAgent.generateVNext(
         [
            {
               role: "user",
               content: inputPrompt,
            },
         ],
         {
            output: extractKnowledgeBrandInfoOutputSchema.pick({
               companyInfo: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);

      if (!result?.object) {
         throw new Error(
            `Failed to extract ${target} brand information: companyInfoExtractorAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { companyInfo } = result.object;
      await updateTargetAnalysisStatus(targetId, target, "analyzing");

      return {
         companyInfo,
         userId,
         websiteUrl,
         targetId,
         target,
      };
   },
});

const saveKnowledgeBrandInfo = createStep({
   id: "save-knowledge-brand-info-step",
   description: "Save brand/competitor information to database with improved target handling",
   inputSchema: extractKnowledgeBrandInfoOutputSchema,
   outputSchema: ExtractKnowledgeBrandInfoOutput,
   execute: async ({ inputData }) => {
      const { companyInfo, targetId, target, websiteUrl } = inputData;

      await updateTargetAnalysisStatus(targetId, target, "analyzing");

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

      try {
         if (target === "competitor") {
            // Update competitor record with brand information
            await updateCompetitor(db, targetId, {
               name: companyInfo.companyName,
               websiteUrl: websiteUrl,
               description: companyInfo.description,
               summary: companyInfo.detailedSummary,
            });

            console.log(
               `[saveKnowledgeBrandInfo] Successfully saved competitor brand information for ${companyInfo.companyName}`,
            );
         } else {
            // TODO: Implement brand update logic when brand repository is available
            console.log(
               `[saveKnowledgeBrandInfo] Brand saving not yet implemented for ${companyInfo.companyName}`,
            );
         }

         await updateTargetAnalysisStatus(targetId, target, "completed");

         return {
            companyInfoId: crypto.randomUUID(),
            chunkCount: 0, // No chunks since we're not saving to vector DB
         };
      } catch (error) {
         console.error(
            "[saveKnowledgeBrandInfo] Error saving brand information:",
            error,
         );
         await updateTargetAnalysisStatus(targetId, target, "failed");
         propagateError(error);
         throw AppError.internal("Failed to save brand information");
      }
   },
});

export const extractKnowledgeBrandInfoWorkflow = createWorkflow({
   id: "extract-knowledge-brand-info",
   description: "Extract brand/competitor information and save to database with improved target support",
   inputSchema: ExtractKnowledgeBrandInfoInput,
   outputSchema: ExtractKnowledgeBrandInfoOutput,
})
   .then(extractKnowledgeBrandInfo)
   .then(saveKnowledgeBrandInfo)
   .commit();