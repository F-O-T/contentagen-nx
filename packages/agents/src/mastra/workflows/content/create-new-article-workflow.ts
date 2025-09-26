import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { articleWriterAgent } from "../../agents/article/article-writer-agent";
import { articleEditorAgent } from "../../agents/article/article-editor-agent";
import { articleReaderAgent } from "../../agents/article/artcile-reader-agent";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   competitorIds: z.array(z.string()),
   organizationId: z.string(),

   request: ContentRequestSchema,
});
const writingType = z
   .string()
   .describe("The detailed article draft, ready for editing");

const editorType = z.string().describe("The edited article, ready for review");

const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }).omit({
      competitorIds: true,
      organizationId: true,
   });
const articleWritingStep = createStep({
   id: "article-writing-step",
   description: "Write the article based on the content strategy and research",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request } = inputData;
      const inputPrompt = `
create a new ${request.layout} based on the conent request.

request: ${request.description}

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
         writing: result.object.writing,
         userId,
         request,
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
const articleEditorStep = createStep({
   id: "article-editor-step",
   description: "Edit the article based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request, writing } = inputData;
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
            }),
         },
      );

      if (!result?.object.editor) {
         throw AppError.validation('Agent output is missing "editor" field');
      }
      return {
         editor: result.object.editor,
         userId,
         request,
      };
   },
});

const ContentReviewerStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      rating: z.number().min(0).max(100),
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
      const { userId, request, editor } = inputData;
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
         userId,
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
   .then(articleWritingStep)
   .then(articleEditorStep)
   .then(articleReadAndReviewStep)
   .commit();
