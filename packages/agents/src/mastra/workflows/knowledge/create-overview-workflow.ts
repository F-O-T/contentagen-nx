import { createWorkflow, createStep } from "@mastra/core/workflows";
import { companyInfoExtractorAgent } from "../../agents/company-info-extractor-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { AppError, propagateError } from "@packages/utils/errors";
import { ingestUsage, type MastraLLMUsage } from "../../helpers";
import { z } from "zod";

export const CreateOverviewInput = z.object({
   websiteUrl: z.url(),
   userId: z.string(),
   id: z.string(),
   target: z.enum(["brand", "competitor"]),
});

export const CreateOverviewOutput = z.object({
   chunkCount: z.number(),
});

const extractOverviewOutputSchema = CreateOverviewInput.extend({
   companyName: z.string().describe("Official company/brand name"),
   description: z.string().describe("Concise 1-2 sentence company description"),
   detailedSummary: z
      .string()
      .describe("Comprehensive 3-5 paragraph company summary"),
   extractionConfidence: z
      .number()
      .min(0)
      .max(1)
      .describe("Overall confidence score for extracted information (0-1)"),
});

const extractOverview = createStep({
   id: "extract-overview-step",
   description:
      "Extract company overview information using company info extractor agent",
   inputSchema: CreateOverviewInput,
   outputSchema: extractOverviewOutputSchema,

   execute: async ({ inputData }) => {
      const { userId, websiteUrl, id, target } = inputData;

      try {
         const inputPrompt = `
I need you to analyze this website and extract comprehensive company information.
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
               output: extractOverviewOutputSchema.pick({
                  companyName: true,
                  detailedSummary: true,
                  description: true,
                  extractionConfidence: true,
               }),
            },
         );

         await ingestUsage(result.usage as MastraLLMUsage, userId);

         if (!result?.object.detailedSummary) {
            throw AppError.internal(
               "Failed to extract company overview information",
            );
         }

         const {
            companyName,
            description,
            detailedSummary,
            extractionConfidence,
         } = result.object;

         return {
            companyName,
            description,
            detailedSummary,
            extractionConfidence,
            userId,
            websiteUrl,
            id,
            target,
         };
      } catch (err) {
         console.error("failed to extract overview for url", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to extract overview information from website",
         );
      }
   },
});

const saveCompetitorOverview = createStep({
   id: "save-competitor-overview-step",
   description: "Save competitor overview information to database",
   inputSchema: extractOverviewOutputSchema,
   outputSchema: CreateOverviewOutput,
   execute: async ({ inputData }) => {
      const { companyName, description, detailedSummary, id, websiteUrl } =
         inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         await updateCompetitor(db, id, {
            name: companyName,
            websiteUrl: websiteUrl,
            description: description,
            summary: detailedSummary,
         });

         return {
            chunkCount: 0,
         };
      } catch (err) {
         console.error("failed to save competitor overview", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to save competitor overview information to database",
         );
      }
   },
});

const saveBrandOverview = createStep({
   id: "save-brand-overview-step",
   description: "Save brand overview information",
   inputSchema: extractOverviewOutputSchema,
   outputSchema: CreateOverviewOutput,
   execute: async () => {
      try {
         return {
            chunkCount: 0,
         };
      } catch (err) {
         console.error("failed to save brand overview", err);
         propagateError(err);
         throw AppError.internal("Failed to save brand overview information");
      }
   },
});

export const createOverviewWorkflow = createWorkflow({
   id: "create-overview",
   description: "Create company overview from analysis",
   inputSchema: CreateOverviewInput,
   outputSchema: CreateOverviewOutput,
})
   .then(extractOverview)
   .branch([
      [
         async ({ inputData: { target } }) => target === "competitor",
         saveCompetitorOverview,
      ],
      [
         async ({ inputData: { target } }) => target === "brand",
         saveBrandOverview,
      ],
   ])
   .commit();
