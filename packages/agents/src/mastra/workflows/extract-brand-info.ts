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

// Helper function to update competitor analysis status
async function updateCompetitorAnalysisStatus(
   competitorId: string,
   status: "pending" | "analyzing" | "chunking" | "completed" | "failed",
) {
   try {
      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });
      await updateCompetitor(db, competitorId, { analysisStatus: status });
   } catch (err) {
      console.error(
         "[CompetitorBrand] Failed to update competitor analysis status in DB:",
         err,
      );
      propagateError(err);
      throw AppError.internal("Failed to update competitor analysis status");
   }
}

// Input schema for the workflow
export const ExtractCompetitorBrandInfoInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   competitorId: z.string(),
});

// Output schema for the workflow
export const ExtractCompetitorBrandInfoOutput = z.object({
   companyInfoId: z.string(),
   chunkCount: z.number(),
   savedLogoPath: z.string().optional(),
});

const extractCompetitorBrandInfoOutputSchema =
   ExtractCompetitorBrandInfoInput.extend({
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

const extractCompetitorBrandInfo = createStep({
   id: "extract-competitor-brand-info-step",
   description:
      "Extract competitor brand information using company info extractor agent",
   inputSchema: ExtractCompetitorBrandInfoInput,
   outputSchema: extractCompetitorBrandInfoOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, competitorId } = inputData;

      await updateCompetitorAnalysisStatus(competitorId, "analyzing");

      const inputPrompt = `
I need you to analyze this competitor website and extract comprehensive company information.
websiteUrl: ${websiteUrl}
userId: ${userId}

Requirements:
- Use the tavilyCrawlTool to extract content from the website
- Use tavilySearchTool only if needed to gather more company information
- Extract the company name, description, and detailed summary
- Focus on company information, not product features
- Ensure high confidence scores for all extracted information
- Provide comprehensive company background and details

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
            output: extractCompetitorBrandInfoOutputSchema.pick({
               companyInfo: true,
            }),
         },
      );

      await ingestUsage(result.usage as LLMUsage, userId);

      if (!result?.object) {
         throw new Error(
            `Failed to extract competitor brand information: companyInfoExtractorAgent.generateVNext returned ${result ? "invalid result" : "null/undefined"}`,
         );
      }

      const { companyInfo } = result.object;
      await updateCompetitorAnalysisStatus(competitorId, "analyzing");

      return {
         companyInfo,
         userId,
         websiteUrl,
         competitorId,
      };
   },
});

const saveCompetitorBrandInfo = createStep({
   id: "save-competitor-brand-info-step",
   description: "Save competitor brand information to database",
   inputSchema: extractCompetitorBrandInfoOutputSchema,
   outputSchema: ExtractCompetitorBrandInfoOutput,
   execute: async ({ inputData }) => {
      const { companyInfo, competitorId, websiteUrl } = inputData;

      // Update status to analyzing
      await updateCompetitorAnalysisStatus(competitorId, "analyzing");

      const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

      try {
         // Update competitor record with brand information
         await updateCompetitor(db, competitorId, {
            name: companyInfo.companyName,
            websiteUrl: websiteUrl,
            description: companyInfo.description,
            summary: companyInfo.detailedSummary,
         });

         console.log(
            `[saveCompetitorBrandInfo] Successfully saved competitor brand information for ${companyInfo.companyName}`,
         );

         // Update status to completed
         await updateCompetitorAnalysisStatus(competitorId, "completed");

         return {
            companyInfoId: crypto.randomUUID(),
            chunkCount: 0, // No chunks since we're not saving to Chroma
         };
      } catch (error) {
         console.error(
            "[saveCompetitorBrandInfo] Error saving competitor brand information:",
            error,
         );
         await updateCompetitorAnalysisStatus(competitorId, "failed");
         propagateError(error);
         throw AppError.internal("Failed to save competitor brand information");
      }
   },
});

export const extractCompetitorBrandInfoWorkflow = createWorkflow({
   id: "extract-competitor-brand-info",
   description: "Extract competitor brand information and save to database",
   inputSchema: ExtractCompetitorBrandInfoInput,
   outputSchema: ExtractCompetitorBrandInfoOutput,
})
   .then(extractCompetitorBrandInfo)
   .then(saveCompetitorBrandInfo)
   .commit();
