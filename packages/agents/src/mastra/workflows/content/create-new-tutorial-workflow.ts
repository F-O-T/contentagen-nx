import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { tutorialWriterAgent } from "../../agents/tutorial/tutorial-writer-agent";
import { tutorialEditorAgent } from "../../agents/tutorial/tutorial-editor-agent";
import { tutorialReaderAgent } from "../../agents/tutorial/tutorial-reader-agent";
import { researcherAgent } from "../../agents/researcher-agent";
import { emitContentStatusChanged } from "@packages/server-events";

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
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const ResearchStepOutputSchema = CreateNewContentWorkflowInputSchema.extend({
   research: z.object({
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
   id: "tutorial-research-step",
   description: "Perform SERP research and competitive analysis",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ResearchStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request, agentId, contentId } = inputData;

      // Emit event when research starts
      emitContentStatusChanged({
         contentId,
         status: "pending",
         message: "Researching for your tutorial...",
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
         throw AppError.validation('Agent output is missing "research" field');
      }

      // Emit event when research completes
      emitContentStatusChanged({
         contentId,
         status: "pending",
         message: "Tutorial research completed",
         layout: request.layout,
      });

      return {
         research: result.object.research,
         userId,
         request,
         agentId,
         contentId,
      };
   },
});

const tutorialWritingStep = createStep({
   id: "tutorial-writing-step",
   description: "Write the tutorial based on the content strategy and research",
   inputSchema: ResearchStepOutputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request, research, agentId, contentId } = inputData;

      // Emit event when writing starts
      emitContentStatusChanged({
         contentId,
         status: "pending",
         message: "Writing your tutorial...",
         layout: request.layout,
      });

      const researchPrompt = `
searchIntent: ${research.searchIntent}
competitorAnalysis: ${research.competitorAnalysis}
contentGaps: ${research.contentGaps}
strategicRecommendations: ${research.strategicRecommendations}
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
         throw AppError.validation('Agent output is missing "research" field');
      }

      // Emit event when writing completes
      emitContentStatusChanged({
         contentId,
         status: "pending",
         message: "Tutorial draft completed",
         layout: request.layout,
      });

      return {
         writing: result.object.writing,
         userId,
         request,
         agentId,
         contentId,
      };
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const tutorialEditorStep = createStep({
   id: "tutorial-editor-step",
   description: "Edit the tutorial based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request, writing, agentId, contentId } = inputData;

      // Emit event when editing starts
      emitContentStatusChanged({
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

      // Emit event when editing completes
      emitContentStatusChanged({
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
      };
   },
});

const ContentReviewerStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
      reasonOfTheRating: z
         .string()
         .describe("The reason for the rating, written in markdown"),
      keywords: z
         .array(z.string())
         .describe("The associeated keywords of the content"),
      sources: z.array(z.string()).describe("The sources found on the search"),
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
      const { userId, request, editor, agentId, contentId } = inputData;

      // Emit event when review starts
      emitContentStatusChanged({
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
               keywords: true,
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

      // Emit event when review completes
      emitContentStatusChanged({
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
         keywords: result.object.keywords,
         sources: ["Your tutorial"],
      };
   },
});

export const createNewTutorialWorkflow = createWorkflow({
   id: "create-new-tutorial-workflow",
   description: "Create a new tutorial",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
})
   .then(researchStep)
   .then(tutorialWritingStep)
   .then(tutorialEditorStep)
   .then(tutorialReadAndReviewStep)
   .commit();
