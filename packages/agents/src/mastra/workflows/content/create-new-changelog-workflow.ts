import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { changelogWriterAgent } from "../../agents/changelog/changelog-writer-agent";
import { changelogEditorAgent } from "../../agents/changelog/changelog-editor-agent";
import { changelogReaderAgent } from "../../agents/changelog/changelog-reader-agent";

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
      const { userId, agentId, contentId, request } = inputData;
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
         throw AppError.validation('Agent output is missing "research" field');
      }
      return {
         writing: result.object.writing,
         agentId,
         contentId,
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
const changelogEditorStep = createStep({
   id: "changelog-editor-step",
   description: "Edit the changelog based on the content research",
   inputSchema: CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   }),
   outputSchema: ContentEditorStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request, agentId, contentId, writing } = inputData;
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
      return {
         agentId,
         contentId,
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
      keywords: z
         .array(z.string())
         .describe("The associeated keywords of the content"),
      sources: z.array(z.string()).describe("The sources found on the search"),
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
      const { userId, agentId, contentId, request, editor } = inputData;
      const inputPrompt = `
i need you to read and review this ${request.layout}.


original:${request.description}

final:${editor}

`;
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
      return {
         rating: result.object.rating,
         reasonOfTheRating: result.object.reasonOfTheRating,
         userId,
         agentId,
         contentId,
         request,
         keywords: result.object.keywords,
         sources: ["Your changelog"],
      };
   },
});

export const createNewChangelogWorkflow = createWorkflow({
   id: "create-new-changelog-workflow",
   description: "Create a new changelog",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
})
   .then(changelogWritingStep)
   .then(changelogEditorStep)
   .then(changelogReadAndReviewStep)
   .commit();
