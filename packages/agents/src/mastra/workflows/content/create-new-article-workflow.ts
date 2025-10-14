import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError, APIError, propagateError } from "@packages/utils/errors";
import { articleWriterAgent } from "../../agents/article/article-writer-agent";
import { articleEditorAgent } from "../../agents/article/article-editor-agent";
import { articleReaderAgent } from "../../agents/article/artcile-reader-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { contentStrategistAgent } from "../../agents/strategist-agent";
import { emitContentStatusChanged } from "@packages/server-events";
import { createDb } from "@packages/database/client";
import { updateContent } from "@packages/database/repositories/content-repository";
import { serverEnv } from "@packages/environment/server";
import { getPaymentClient } from "@packages/payment/client";
import {
   createAiUsageMetadata,
   ingestBilling,
} from "@packages/payment/ingestion";
import {
   getKeywordsFromText,
   createDescriptionFromText,
} from "@packages/utils/text";

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
   competitorIds: z.array(z.string()),
   organizationId: z.string(),
   contentId: z.string(),
   agentId: z.string(),
   request: ContentRequestSchema,
});
const writingType = z
   .string()
   .describe("The detailed article draft, ready for editing");

const editorType = z.string().describe("The edited article, ready for review");
const StrategyStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   strategy: z.object({
      brandPositioning: z.string().describe("The brand positioning strategy"),
      contentAngles: z.string(),
      keyMessages: z.string(),
      brandInsights: z.string(),
      competitorInsights: z.string(),
      uniqueDifferentiators: z.string(),
   }),
}).omit({
   competitorIds: true,
   organizationId: true,
});
export const strategyStep = createStep({
   id: "article-strategy-step",
   description: "Create brand-aligned content strategy",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: StrategyStepOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      try {
         const {
            contentId,
            userId,
            agentId,
            competitorIds,
            organizationId,
            request,
         } = inputData;

         // Emit event when strategy starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Developing content strategy for your article...",
            layout: request.layout,
         });

         const inputPrompt = `
I need you to create a comprehensive content strategy for the following request:

**User Request:** ${request.description}
**Content Type:** ${request.layout}
**Organization ID:** ${organizationId}
**Competitor IDs:** ${competitorIds.join(", ")}

Please develop a strategic brief that:
1. Analyzes user intent and content expectations
2. Leverages brand knowledge to identify unique positioning opportunities
3. Analyzes competitive landscape using competitor intelligence
4. Creates a differentiated content strategy with clear recommendations
5. Defines specific content requirements and success metrics

Focus on creating a strategy that leverages our brand's unique strengths and differentiates us from competitors.
`;

         const result = await contentStrategistAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
               output: StrategyStepOutputSchema.pick({
                  strategy: true,
               }),
            },
         );

         if (!result?.object.strategy) {
            throw AppError.validation(
               'Agent output is missing "strategy" field',
            );
         }

         // Ingest LLM usage for billing
         if (result.usage) {
            await ingestUsage(result.usage as LLMUsage, userId);
         }

         // Emit event when strategy completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Article strategy completed",
            layout: request.layout,
         });

         return {
            agentId,
            strategy: result.object.strategy,
            userId,
            contentId,
            request,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to create article strategy",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to create article strategy: ${(error as Error).message}`,
         );
      }
   },
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
   id: "article-research-step",
   description: "Perform SERP research and competitive analysis",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      try {
         const { contentId, userId, agentId, request } = inputData;

         // Emit event when research starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Researching for your article...",
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

         const result = await researcherAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,

               output: ResearchStepOutputSchema.omit({
                  agentId: true,
                  contentId: true,
                  userId: true,
                  request: true,
               }),
            },
         );

         console.log("Research Agent Result:", result.object);
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
            message: "Article research completed",
            layout: request.layout,
         });

         return {
            ...result.object,
            userId,
            agentId,
            request,
            contentId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to research article",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to research article: ${(error as Error).message}`,
         );
      }
   },
});
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
const ArticleWritingStepInputSchema = z.object({
   "article-research-step": ResearchStepOutputSchema,
   "article-strategy-step": StrategyStepOutputSchema,
});
const articleWritingStep = createStep({
   id: "article-writing-step",
   description: "Write the article based on the content strategy and research",
   inputSchema: ArticleWritingStepInputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      try {
         const {
            "article-research-step": {
               request,
               contentId,
               agentId,
               searchIntent,
               competitorAnalysis,
               contentGaps,
               strategicRecommendations,
               sources,
               userId,
            },
            "article-strategy-step": { strategy },
         } = inputData;

         // Emit event when writing starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Writing your article...",
            layout: request.layout,
         });

         const strategyPrompt = `
brandInsights: ${strategy.brandInsights}
      
competitorInsights: ${strategy.competitorInsights}
      
uniqueDifferentiators: ${strategy.uniqueDifferentiators}
      
keyMessages: ${strategy.keyMessages}
      
contentAngles: ${strategy.contentAngles}
      
brandPositioning: ${strategy.brandPositioning}
         
`;
         const researchPrompt = `
searchIntent: ${searchIntent}
competitorAnalysis: ${competitorAnalysis}
contentGaps: ${contentGaps}
strategicRecommendations: ${strategicRecommendations}
`;
         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

${strategyPrompt}

${researchPrompt}

`;
         const result = await articleWriterAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,

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
            message: "Article draft completed",
            layout: request.layout,
         });

         return {
            writing: result.object.writing,
            sources,
            userId,
            agentId,
            request,
            contentId,
         };
      } catch (error) {
         // Extract contentId and layout from the appropriate input data structure
         const { contentId, request } = inputData["article-research-step"];
         await updateContentStatus({
            contentId,
            status: "failed",
            message: "Failed to write article",
            layout: request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to write article: ${(error as Error).message}`,
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
const articleEditorStep = createStep({
   id: "article-editor-step",
   description: "Edit the article based on the content research",
   inputSchema: ContentWritingStepOutputSchema,
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      try {
         const { userId, contentId, request, agentId, writing, sources } =
            inputData;

         // Emit event when editing starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Editing your article...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to edit this ${request.layout} draft.

writing: ${writing}

output the edited content in markdown format.
`;
         const result = await articleEditorAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
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
            message: "Article editing completed",
            layout: request.layout,
         });

         return {
            agentId,
            editor: result.object.editor,
            userId,
            sources,
            contentId,
            request,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to edit article",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to edit article: ${(error as Error).message}`,
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
export const articleReadAndReviewStep = createStep({
   id: "article-read-and-review-step",
   description: "Read and review the article",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
   execute: async ({ inputData, runtimeContext }) => {
      try {
         const { contentId, sources, userId, agentId, request, editor } =
            inputData;

         // Emit event when review starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Reviewing your article...",
            layout: request.layout,
         });

         const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;
         const result = await articleReaderAgent.generate(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               runtimeContext,
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
            message: "Article review completed",
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
            sources,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to review article",
            layout: inputData.request.layout,
         });
         propagateError(error);
         throw AppError.internal(
            `Failed to review article: ${(error as Error).message}`,
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

export const articleSeoOptimizationStep = createStep({
   id: "article-seo-optimization-step",
   description: "Generate SEO keywords and meta description for the article",
   inputSchema: ContentEditorStepOutputSchema,
   outputSchema: SeoOptimizationStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { agentId, userId, contentId, request, editor } = inputData;

         // Update content status and emit event when SEO optimization starts
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "Optimizing SEO for your article...",
            layout: request.layout,
         });

         const keywords = getKeywordsFromText({
            text: editor,
            minLength: 8,
         });
         const metaDescription = createDescriptionFromText({
            text: editor,
            maxLength: 180,
         });

         // Update content status and emit event when SEO optimization completes
         await updateContentStatus({
            contentId,
            status: "pending",
            message: "SEO optimization completed",
            layout: request.layout,
         });

         return {
            keywords,
            metaDescription,
            userId,
            contentId,
            request,
            agentId,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to optimize SEO for article",
            layout: inputData.request.layout,
         });
         console.error(error);
         propagateError(error);
         throw APIError.internal("Failed to optimize SEO for article");
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

export const articleFinalResultStep = createStep({
   id: "article-final-result-step",
   description: "Combine reader and SEO results into final output",
   inputSchema: z.object({
      "article-read-and-review-step": ContentReviewerStepOutputSchema,
      "article-seo-optimization-step": SeoOptimizationStepOutputSchema,
   }),
   outputSchema: FinalResultStepOutputSchema,
   execute: async ({ inputData }) => {
      const readerResult = inputData["article-read-and-review-step"];
      const seoResult = inputData["article-seo-optimization-step"];
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

export const createNewArticleWorkflow = createWorkflow({
   id: "create-new-article-workflow",
   description: "Create a new article",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: FinalResultStepOutputSchema,
})
   .parallel([researchStep, strategyStep])
   .then(articleWritingStep)
   .then(articleEditorStep)
   .parallel([articleReadAndReviewStep, articleSeoOptimizationStep])
   .then(articleFinalResultStep)
   .commit();
