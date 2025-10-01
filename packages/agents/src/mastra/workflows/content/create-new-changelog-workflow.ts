import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { APIError, AppError, propagateError } from "@packages/utils/errors";
import { changelogWriterAgent } from "../../agents/changelog/changelog-writer-agent";
import { changelogEditorAgent } from "../../agents/changelog/changelog-editor-agent";
import { changelogReaderAgent } from "../../agents/changelog/changelog-reader-agent";
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
   .describe("The detailed changelog draft, ready for editing");

const editorType = z
   .string()
   .describe("The edited changelog, ready for review");

const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const changelogWritingStep = createStep({
   id: "changelog-writing-step",
   description:
      "Write the changelog based on the content strategy and research",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, agentId, contentId, request } = inputData;

         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Writing your changelog...",
            layout: request.layout,
         });

         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

`;
         const result = await changelogWriterAgent.generateVNext(
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

         // Update content status and emit event when writing completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Changelog draft completed",
            layout: request.layout,
         });

         return {
            writing: result.object.writing,
            agentId,
            contentId,
            userId,
            request,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to write changelog",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to write changelog: ${(error as Error).message}`
         );
      }
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const changelogEditorStep = createStep({
   id: "changelog-editor-step",
   description: "Edit the changelog based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, request, agentId, contentId, writing } = inputData;

         // Update content status and emit event when editing starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Editing your changelog...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to edit this ${request.layout} draft.

writing: ${writing}

output the edited content in markdown format.
`;
         const result = await changelogEditorAgent.generateVNext(
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

         // Update content status and emit event when editing completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Changelog editing completed",
            layout: request.layout,
         });

         return {
            agentId,
            contentId,
            editor: result.object.editor,
            userId,
            request,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to edit changelog",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to edit changelog: ${(error as Error).message}`
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
export const changelogReadAndReviewStep = createStep({
   id: "changelog-read-and-review-step",
   description: "Read and review the changelog",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, agentId, contentId, request, editor } = inputData;

         // Update content status and emit event when review starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Reviewing your changelog...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;
         //TODO: Rework

         const result = await changelogReaderAgent.generateVNext(
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

         // Update content status and emit event when review completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Changelog review completed",
            layout: request.layout,
         });

         return {
            rating: result.object.rating,
            reasonOfTheRating: result.object.reasonOfTheRating,
            userId,
            agentId,
            contentId,
            request,
            editor,
            sources: ["Your changelog"],
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to review changelog",
            layout: inputData.request.layout,
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to review changelog");
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

export const changelogSeoOptimizationStep = createStep({
   id: "changelog-seo-optimization-step",
   description: "Generate SEO keywords and meta description for the changelog",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: SeoOptimizationStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, agentId, contentId, request, editor } = inputData;

         // Update content status and emit event when SEO optimization starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Optimizing SEO for your changelog...",
            layout: request.layout,
         });

         const inputPrompt = `
I need you to perform SEO optimization for this ${request.layout} changelog content.

Content:
${editor}

Generate SEO-optimized keywords and meta description for this changelog content.

Requirements:
- Keywords should be relevant to changelog content and technology updates
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
            agentId,
            contentId,
            request,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to optimize SEO for changelog",
            layout: inputData.request.layout,
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to optimize SEO for changelog");
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

export const changelogFinalResultStep = createStep({
   id: "changelog-final-result-step",
   description: "Combine reader and SEO results into final output",
   inputSchema: z.object({
      "changelog-read-and-review-step": ContentReviewerStepOutputSchema,
      "changelog-seo-optimization-step": SeoOptimizationStepOutputSchema,
   }),
   outputSchema: FinalResultStepOutputSchema,
   execute: async ({ inputData }) => {
      const readerResult = inputData["changelog-read-and-review-step"];
      const seoResult = inputData["changelog-seo-optimization-step"];
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

export const createNewChangelogWorkflow = createWorkflow({
   id: "create-new-changelog-workflow",
   description: "Create a new changelog",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: FinalResultStepOutputSchema,
   retryConfig: {
      attempts: 3,
   },
})
   .then(changelogWritingStep)
   .then(changelogEditorStep)
   .parallel([changelogReadAndReviewStep, changelogSeoOptimizationStep])
   .then(changelogFinalResultStep)
   .commit();
