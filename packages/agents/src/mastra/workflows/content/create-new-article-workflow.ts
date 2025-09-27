import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { articleWriterAgent } from "../../agents/article/article-writer-agent";
import { articleEditorAgent } from "../../agents/article/article-editor-agent";
import { articleReaderAgent } from "../../agents/article/artcile-reader-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { contentStrategistAgent } from "../../agents/strategist-agent";

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
      const { userId, agentId, competitorIds, organizationId, request } =
         inputData;
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
         throw AppError.validation('Agent output is missing "strategy" field');
      }

      return {
         agentId,
         strategy: result.object.strategy,
         userId,
         request,
      };
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
      const { userId, agentId, request } = inputData;
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
         throw AppError.validation('Agent output is missing "research" field');
      }

      return {
         research: result.object.research,
         userId,
         agentId,
         request,
      };
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
      const {
         "article-research-step": { request, agentId, research, userId },
         "article-strategy-step": { strategy },
      } = inputData;
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
         throw AppError.validation('Agent output is missing "research" field');
      }
      return {
         research,
         writing: result.object.writing,
         userId,
         agentId,
         request,
      };
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
      const { userId, research, request, agentId, writing } = inputData;
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
      return {
         agentId,
         metaDescription: result.object.metaDescription,
         editor: result.object.editor,
         userId,
         research,
         request,
      };
   },
});

const ContentReviewerStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
      metaDescription: z
         .string()
         .describe(
            "The meta description, being a SEO optmizaed description of the article",
         ),
      keywords: z
         .array(z.string())
         .describe("The associeated keywords of the content"),
      sources: z.array(z.string()).describe("The sources found on the search"),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
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
      const { metaDescription, research, userId, agentId, request, editor } =
         inputData;
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

      return {
         rating: result.object.rating,
         reasonOfTheRating: result.object.reasonOfTheRating,
         metaDescription,
         keywords: research.research.keywords,
         sources: research.research.sources,
         agentId,
         userId,
         editor,
         request,
      };
   },
});

export const createNewArticleWorkflow = createWorkflow({
   id: "create-new-article-workflow",
   description: "Create a new article",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
})
   .parallel([researchStep, strategyStep])
   .then(articleWritingStep)
   .then(articleEditorStep)
   .then(articleReadAndReviewStep)
   .commit();
