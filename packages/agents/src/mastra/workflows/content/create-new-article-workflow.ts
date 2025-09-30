import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError, APIError, propagateError } from "@packages/utils/errors";
import { articleWriterAgent } from "../../agents/article/article-writer-agent";
import { articleEditorAgent } from "../../agents/article/article-editor-agent";
import { articleReaderAgent } from "../../agents/article/artcile-reader-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { contentStrategistAgent } from "../../agents/strategist-agent";
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
   execute: async ({ inputData }) => {
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

         const result = await contentStrategistAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
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
         throw error;
      }
   },
});

const ResearchStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   research: z.object({
      keywords: z
         .array(z.string())
         .describe("The associeated keywords of the content"),
      sources: z.array(z.string()).describe("The sources found on the search"),
      searchIntent: z.string(),
      competitorAnalysis: z.string(),
      contentGaps: z.string(),
      strategicRecommendations: z.string(),
   }),
}).omit({
   competitorIds: true,
   organizationId: true,
});

export const researchStep = createStep({
   id: "article-research-step",
   description: "Perform SERP research and competitive analysis",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
   execute: async ({ inputData }) => {
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
I need you to perform comprehensive SERP research for the following content request:

**Topic:** ${request.description}
**Content Type:** ${request.layout}

Please conduct thorough SERP analysis and competitive intelligence gathering to identify:
1. Search intent and user expectations
2. Top ranking competitors and their content strategies
3. Content gaps and opportunities
4. Strategic recommendations for outranking competitors

Focus on finding the most effective content angle and structure that can achieve top rankings.
`;

         const result = await researcherAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ResearchStepOutputSchema.pick({
                  research: true,
               }),
            },
         );

         if (!result?.object.research) {
            throw AppError.validation(
               'Agent output is missing "research" field',
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
            research: result.object.research,
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
         throw error;
      }
   },
});
const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
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
   execute: async ({ inputData }) => {
      try {
         const {
            "article-research-step": {
               request,
               contentId,
               agentId,
               research,
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
searchIntent: ${research.searchIntent}
competitorAnalysis: ${research.competitorAnalysis}
contentGaps: ${research.contentGaps}
strategicRecommendations: ${research.strategicRecommendations}
`;
         const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

${strategyPrompt}

${researchPrompt}

`;
         const result = await articleWriterAgent.generateVNext(
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
            message: "Article draft completed",
            layout: request.layout,
         });

         return {
            research,
            writing: result.object.writing,
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
         throw error;
      }
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      research: ResearchStepOutputSchema.pick({
         research: true,
      }),

      editor: editorType,
      metaDescription: z
         .string()
         .describe(
            "The meta description, being a SEO optmizaed description of the article",
         ),
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const articleEditorStep = createStep({
   id: "article-editor-step",
   description: "Edit the article based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
      research: ResearchStepOutputSchema.pick({
         research: true,
      }),
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      try {
         const { userId, contentId, research, request, agentId, writing } =
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
         const result = await articleEditorAgent.generateVNext(
            [
               {
                  role: "user",
                  content: inputPrompt,
               },
            ],
            {
               output: ContentEditorStepOutputSchema.pick({
                  editor: true,
                  metaDescription: true,
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
            metaDescription: result.object.metaDescription,
            editor: result.object.editor,
            userId,
            research,
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
         throw error;
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
   execute: async ({ inputData }) => {
      try {
         const { contentId, research, userId, agentId, request, editor } =
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
         const result = await articleReaderAgent.generateVNext(
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
            sources: research.research.sources,
         };
      } catch (error) {
         await updateContentStatus({
            contentId: inputData.contentId,
            status: "failed",
            message: "Failed to review article",
            layout: inputData.request.layout,
         });
         throw error;
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

         const inputPrompt = `
I need you to perform SEO optimization for this ${request.layout} content.

Content:
${editor}

Generate SEO-optimized keywords and meta description for this article content.

Requirements:
- Keywords should be relevant to the article topic and content
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
