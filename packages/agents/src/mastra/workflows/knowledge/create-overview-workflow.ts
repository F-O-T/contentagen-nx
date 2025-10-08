import { createWorkflow, createStep } from "@mastra/core/workflows";
import { companyInfoExtractorAgent } from "../../agents/company-info-extractor-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { updateCompetitor } from "@packages/database/repositories/competitor-repository";
import { updateBrand } from "@packages/database/repositories/brand-repository";
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
   companyName: z
      .string()
      .describe(
         "The official company or brand name as it appears on their website",
      ),
   detailedSummary: z
      .string()
      .describe(
         "A comprehensive 3-5 paragraph summary (150-300 words) covering: what the company does (core business and offerings), who they serve (target customers and market), company background (founding, location, size if available), and what differentiates them from competitors",
      ),
});

const extractOverview = createStep({
   id: "extract-overview-step",
   description:
      "Extract company overview information using company info extractor agent",
   inputSchema: CreateOverviewInput,
   outputSchema: extractOverviewOutputSchema,

   execute: async ({ inputData, runtimeContext }) => {
      const { userId, websiteUrl, id, target } = inputData;

      try {
         const inputPrompt = `Extract company information from: ${websiteUrl}

Provide the official company name and a comprehensive summary covering their business, customers, background, and differentiators.`;

         const result = await companyInfoExtractorAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: extractOverviewOutputSchema.pick({
                  companyName: true,
                  detailedSummary: true,
               }),
            },
         );

         await ingestUsage(result.usage as MastraLLMUsage, userId);

         if (!result?.object.detailedSummary) {
            throw AppError.internal(
               "Failed to extract company overview information",
            );
         }

         const { companyName, detailedSummary } = result.object;

         return {
            companyName,
            detailedSummary,
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
      const { companyName, detailedSummary, id, websiteUrl } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         await updateCompetitor(db, id, {
            name: companyName,
            websiteUrl: websiteUrl,
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
   description: "Save brand overview information to database",
   inputSchema: extractOverviewOutputSchema,
   outputSchema: CreateOverviewOutput,
   execute: async ({ inputData }) => {
      const { companyName, detailedSummary, id, websiteUrl } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         await updateBrand(db, id, {
            name: companyName,
            websiteUrl: websiteUrl,
            summary: detailedSummary,
         });

         return {
            chunkCount: 0,
         };
      } catch (err) {
         console.error("failed to save brand overview", err);
         propagateError(err);
         throw AppError.internal(
            "Failed to save brand overview information to database",
         );
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
