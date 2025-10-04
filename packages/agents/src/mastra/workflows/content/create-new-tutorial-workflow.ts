import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError, APIError, propagateError } from "@packages/utils/errors";
import { tutorialWriterAgent } from "../../agents/tutorial/tutorial-writer-agent";
import { tutorialEditorAgent } from "../../agents/tutorial/tutorial-editor-agent";
import { tutorialReaderAgent } from "../../agents/tutorial/tutorial-reader-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { seoOptimizationAgent } from "../../agents/seo-agent";
import { emitContentStatusChanged } from "@packages/server-events";
import { createDb } from "@packages/database/client";
import { updateContent } from "@packages/database/repositories/content-repository";
import { serverEnv } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";

// Internal helper function to update content status and emit events
async function updateContentStatus(
   payload: Parameters<typeof emitContentStatusChanged>[0],
) {
   try {
      const { contentId, status, message, layout } = payload;
      const db = createDb({
         databaseUrl: serverEnv.DATABASE_URL,
      });

      await updateContent(db, contentId, {
         status,
      });

      emitContentStatusChanged({
         contentId,
         status,
         message,
         layout,
      });
   } catch (error) {
      console.error("Failed to update content status:", error);
      propagateError(error);
      throw APIError.internal("Failed to update content status");
   }
}

// LLM usage tracking
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
      effort: "grok-4-fast",
      inputTokens: usage.inputTokens,
      outputTokens: usage.outputTokens,
   });
   await ingestBilling(paymentClient, {
      externalCustomerId: userId,
      metadata: usageMetadata,
   });
}

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   agentId: z.string(),
   contentId: z.string(),
   competitorIds: z.array(z.string()),
   organizationId: z.string(),
   request: ContentRequestSchema,
});
const writingType = z
   .string()
   .describe("The detailed tutorial draft, ready for editing");

const editorType = z.string().describe("The edited tutorial, ready for review");

const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
      sources: z
         .array(z.string())
         .describe("The URLs found during web search research"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const ResearchStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   searchIntent: z.string().describe("The search intent and user expectations"),
   competitorAnalysis: z
      .string()
      .describe("Analysis of top ranking competitors and their strategies"),
   contentGaps: z
      .string()
      .describe("Content gaps and opportunities identified"),
   strategicRecommendations: z
      .string()
      .describe("Strategic recommendations for outranking competitors"),
   sources: z
      .array(z.string())
      .describe("The URLs found during web search research"),
}).omit({
   competitorIds: true,
   organizationId: true,
});
export const researchStep = createStep({
   id: "tutorial-research-step",
   description: "Perform SERP research and competitive analysis",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, request, agentId, contentId } = inputData;

         // Emit event when research starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Researching for your tutorial...",
            layout: request.layout,
         });

         const inputPrompt = `
I need you to perform SERP research for the following content request:

**Topic:** ${request.description}
**Content Type:** ${request.layout}

Please conduct SERP analysis to identify:
1. Search intent and user expectations
2. Top ranking competitors and their strategies
3. Content gaps and opportunities
4. Strategic recommendations for content
5. Source URLs from web searches used for research

Focus on the research findings only and include actual URLs found during your web searches.
`;

         const result = await researcherAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ResearchStepOutputSchema.omit({
                  agentId: true,
                  contentId: true,
                  userId: true,
                  request: true,
               }),
            },
         );

         if (!result?.object.searchIntent) {
            throw AppError.validation(
               'Agent output is missing "searchIntent" field',
            );
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Emit event when research completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Tutorial research completed",
            layout: request.layout,
         });

         return {
            ...result.object,
            userId,
            request,
            agentId,
            contentId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to research tutorial",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to research tutorial: ${(error as Error).message}`,
         );
      }
   },
});

const tutorialWritingStep = createStep({
   id: "tutorial-writing-step",
   description: "Write the tutorial based on the content strategy and research",
   inputSchema: ResearchStepOutputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const {
            userId,
            request,
            competitorAnalysis,
            contentGaps,
            searchIntent,
            strategicRecommendations,
            sources,
            agentId,
            contentId,
         } = inputData;

         // Emit event when writing starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Writing your tutorial...",
            layout: request.layout,
         });

         const researchPrompt = `
searchIntent: ${searchIntent}
competitorAnalysis: ${competitorAnalysis}
contentGaps: ${contentGaps}
strategicRecommendations: ${strategicRecommendations}
`;

         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

${researchPrompt}

`;
         const result = await tutorialWriterAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ContentWritingStepOutputSchema.pick({
                  writing: true,
               }),
            },
         );

         if (!result?.object.writing) {
            throw AppError.validation(
               'Agent output is missing "research" field',
            );
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Emit event when writing completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Tutorial draft completed",
            layout: request.layout,
         });

         return {
            writing: result.object.writing,
            sources,

            userId,
            request,
            agentId,
            contentId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to write tutorial",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to write tutorial: ${(error as Error).message}`,
         );
      }
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
      sources: z
         .array(z.string())
         .describe("The URLs found during web search research"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const tutorialEditorStep = createStep({
   id: "tutorial-editor-step",
   description: "Edit the tutorial based on the content research",
   inputSchema: ContentWritingStepOutputSchema,
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, request, writing, agentId, contentId, sources } =
            inputData;

         // Emit event when editing starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Editing your tutorial...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to edit this ${request.layout} draft.

writing: ${writing}

output the edited content in markdown format.
`;
         const result = await tutorialEditorAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ContentEditorStepOutputSchema.pick({
                  editor: true,
               }),
            },
         );

         if (!result?.object.editor) {
            throw AppError.validation('Agent output is missing "editor" field');
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Emit event when editing completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Tutorial editing completed",
            layout: request.layout,
         });

         return {
            editor: result.object.editor,
            userId,
            request,
            agentId,
            contentId,
            sources,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to edit tutorial",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to edit tutorial: ${(error as Error).message}`,
         );
      }
   },
});

const ContentReviewerStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
      sources: z.array(z.string()).describe("The sources found on the search"),
      editor: editorType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
export const tutorialReadAndReviewStep = createStep({
   id: "tutorial-read-and-review-step",
   description: "Read and review the tutorial",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, request, editor, agentId, contentId, sources } =
            inputData;

         // Emit event when review starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Reviewing your tutorial...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;

         //TODO: Rework
         const result = await tutorialReaderAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ContentReviewerStepOutputSchema.pick({
                  rating: true,
                  reasonOfTheRating: true,
               }),
            },
         );
         if (!result?.object.rating) {
            throw AppError.validation('Agent output is missing "review" field');
         }
         if (!result?.object.reasonOfTheRating) {
            throw AppError.validation(
               'Agent output is missing "reasonOfTheRating" field',
            );
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Emit event when review completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Tutorial review completed",
            layout: request.layout,
         });

         return {
            rating: result.object.rating,
            reasonOfTheRating: result.object.reasonOfTheRating,
            userId,
            request,
            agentId,
            editor,
            contentId,
            sources,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to review tutorial",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to review tutorial: ${(error as Error).message}`,
         );
      }
   },
});

const SeoOptimizationStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      keywords: z
         .array(z.string())
         .describe(
            "The associated keywords of the content for SEO optimization",
         ),
      metaDescription: z
         .string()
         .describe("The SEO optimized meta description of the content"),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });

export const tutorialSeoOptimizationStep = createStep({
   id: "tutorial-seo-optimization-step",
   description: "Generate SEO keywords and meta description for the tutorial",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: SeoOptimizationStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, agentId, contentId, request, editor } = inputData;

         // Update content status and emit event when SEO optimization starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Optimizing SEO for your tutorial...",
            layout: request.layout,
         });

         const inputPrompt = `
I need you to perform SEO optimization for this ${request.layout} content.

Content:
${editor}

Generate SEO-optimized keywords and meta description for this tutorial content.

Requirements:
- Keywords should be relevant to the tutorial topic and learning objectives
- Meta description should be compelling and include primary keywords
- Follow SEO best practices for character limits and optimization
`;

         const result = await seoOptimizationAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: SeoOptimizationStepOutputSchema.pick({
                  keywords: true,
                  metaDescription: true,
               }),
            },
         );

         if (!result?.object.keywords) {
            throw AppError.validation(
               'Agent output is missing "keywords" field',
            );
         }
         if (!result?.object.metaDescription) {
            throw AppError.validation(
               'Agent output is missing "metaDescription" field',
            );
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Update content status and emit event when SEO optimization completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "SEO optimization completed",
            layout: request.layout,
         });

         return {
            keywords: result.object.keywords,
            metaDescription: result.object.metaDescription,
            userId,
            contentId,
            request,
            agentId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to optimize SEO for tutorial",
            layout: inputData.request.layout,
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to optimize SEO for tutorial");
      }
   },
});

const FinalResultStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   rating: z.number().min(0).max(100),
   reasonOfTheRating: z
      .string()
      .describe("The reason for the rating, written in markdown"),
   keywords: z
      .array(z.string())
      .describe("The associated keywords of the content"),
   sources: z.array(z.string()).describe("The sources found on the search"),
   metaDescription: z
      .string()
      .describe(
         "The meta description, being a SEO optimized description of the article",
      ),
   editor: editorType,
}).omit({
   competitorIds: true,
   organizationId: true,
});

export const tutorialFinalResultStep = createStep({
   id: "tutorial-final-result-step",
   description: "Combine reader and SEO results into final output",
   inputSchema: z.object({
      "tutorial-read-and-review-step": ContentReviewerStepOutputSchema,
      "tutorial-seo-optimization-step": SeoOptimizationStepOutputSchema,
   }),
   outputSchema: FinalResultStepOutputSchema,
   execute: async ({ inputData }) => {
      const readerResult = inputData["tutorial-read-and-review-step"];
      const seoResult = inputData["tutorial-seo-optimization-step"];
      const { contentId, request } = readerResult;
      try {
         // Update content status and emit event when final result compilation starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Compiling final results...",
            layout: request.layout,
         });

         // Combine results - prioritize SEO keywords and meta description
         const finalResult = {
            rating: readerResult.rating,
            reasonOfTheRating: readerResult.reasonOfTheRating,
            keywords: seoResult.keywords,
            sources: readerResult.sources,
            metaDescription: seoResult.metaDescription,
            editor: readerResult.editor,
            userId: readerResult.userId,
            agentId: readerResult.agentId,
            contentId: readerResult.contentId,
            request: readerResult.request,
         };

         // Update content status and emit event when final result compilation completes

         return finalResult;
      } catch (error) {
         await updateContentStatus({
            contentId: contentId,
            status: "failed",
            message: "Failed to compile final results",
            layout: request.layout,
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to compile final results");
      }
   },
});

export const createNewTutorialWorkflow = createWorkflow({
   id: "create-new-tutorial-workflow",
   description: "Create a new tutorial",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: FinalResultStepOutputSchema,
})
   .then(researchStep)
   .then(tutorialWritingStep)
   .then(tutorialEditorStep)
   .parallel([tutorialReadAndReviewStep, tutorialSeoOptimizationStep])
   .then(tutorialFinalResultStep)
   .commit();
