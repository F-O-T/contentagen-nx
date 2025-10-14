import { createWorkflow, createStep } from "@mastra/core/workflows";
import { competitorIntelligenceAgent } from "../agents/competitor-intelligence-agent";
import { serverEnv } from "@packages/environment/server";
import { createDb } from "@packages/database/client";
import { listCompetitors } from "@packages/database/repositories/competitor-repository";
import { updateCompetitorSummary } from "@packages/database/repositories/competitor-summary-repository";
import { ingestUsage, type MastraLLMUsage } from "../helpers";
import { z } from "zod";

export const CreateCompetitorSummaryInput = z.object({
   organizationId: z.string(),
   userId: z.string(),
   summaryId: z.string(),
});

export const CreateCompetitorSummaryOutput = z.object({
   summary: z
      .string()
      .describe(
         "The generated competitor intelligence summary in markdown format",
      ),
   summaryId: z.string(),
   competitorCount: z.number(),
});

// Step 1: Get competitor IDs for the organization
const getCompetitorIds = createStep({
   id: "get-competitor-ids-step",
   description: "Retrieve all competitor IDs for the organization",
   inputSchema: CreateCompetitorSummaryInput,
   outputSchema: CreateCompetitorSummaryInput.extend({
      competitorIds: z.array(z.string()),
   }),

   execute: async ({ inputData }) => {
      const { organizationId, userId, summaryId } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         const competitors = await listCompetitors(db, {
            userId,
            organizationId,
            page: 1,
            limit: 1000, // Get all competitors
         });

         const competitorIds = competitors.map((competitor) => competitor.id);

         if (competitorIds.length === 0) {
            throw new Error("No competitors found for this organization");
         }

         return {
            organizationId,
            userId,
            summaryId,
            competitorIds,
         };
      } catch (err) {
         console.error("Failed to get competitor IDs:", err);
         throw new Error(
            `Failed to retrieve competitors: ${err instanceof Error ? err.message : "Unknown error"}`,
         );
      }
   },
});

// Step 2: Generate the summary using AI
const generateSummary = createStep({
   id: "generate-summary-step",
   description: "Generate competitor intelligence summary using AI analysis",
   inputSchema: CreateCompetitorSummaryInput.extend({
      competitorIds: z.array(z.string()),
   }),
   outputSchema: CreateCompetitorSummaryInput.extend({
      competitorIds: z.array(z.string()),
      summary: z
         .string()
         .describe(
            "The generated competitor intelligence summary in markdown format",
         ),
   }),

   execute: async ({ inputData, runtimeContext }) => {
      const { organizationId, userId, summaryId, competitorIds } = inputData;

      try {
         const inputPrompt = `Based on the competitors with IDs: ${competitorIds.join(", ")}, please generate a brief weekly competitive overview.

Focus on actionable insights for this week - what should I do based on competitor activities?

Keep it concise (150-200 words max) with:
- 1 key competitor move to watch this week
- 1 opportunity I should act on
- 1 threat to be aware of
- 1 quick strategic recommendation

Format as a brief weekly strategic brief - not a comprehensive analysis.`;

         const result = await competitorIntelligenceAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: z.object({
                  summary: z
                     .string()
                     .describe(
                        "The competitor intelligence summary in markdown format",
                     ),
               }),
            },
         );

         // Charge user for AI usage
         await ingestUsage(result.usage as MastraLLMUsage, userId);

         if (!result?.object.summary) {
            throw new Error(
               "Failed to generate competitor summary - no summary content returned",
            );
         }

         return {
            organizationId,
            userId,
            summaryId,
            competitorIds,
            summary: result.object.summary,
         };
      } catch (err) {
         console.error("Failed to generate competitor summary:", err);
         throw new Error(
            `Competitor summary generation failed: ${err instanceof Error ? err.message : "Unknown error"}`,
         );
      }
   },
});

// Step 3: Save the summary to database
const saveSummary = createStep({
   id: "save-summary-step",
   description: "Save the generated summary to the database",
   inputSchema: CreateCompetitorSummaryInput.extend({
      competitorIds: z.array(z.string()),
      summary: z.string(),
   }),
   outputSchema: CreateCompetitorSummaryOutput,

   execute: async ({ inputData }) => {
      const { summaryId, competitorIds, summary } = inputData;

      try {
         const db = createDb({ databaseUrl: serverEnv.DATABASE_URL });

         await updateCompetitorSummary(db, summaryId, {
            summary,
            status: "completed",
            lastGeneratedAt: new Date(),
         });

         return {
            summary,
            summaryId,
            competitorCount: competitorIds.length,
         };
      } catch (err) {
         console.error("Failed to save competitor summary:", err);
         throw new Error(
            `Failed to save summary to database: ${err instanceof Error ? err.message : "Unknown error"}`,
         );
      }
   },
});

export const createCompetitorSummaryWorkflow = createWorkflow({
   id: "create-competitor-summary",
   description:
      "Generate competitive intelligence summary from competitor analysis",
   inputSchema: CreateCompetitorSummaryInput,
   outputSchema: CreateCompetitorSummaryOutput,
})
   .then(getCompetitorIds)
   .then(generateSummary)
   .then(saveSummary)
   .commit();
