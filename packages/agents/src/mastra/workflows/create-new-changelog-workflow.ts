import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { AppError } from "@packages/utils/errors";
import { changelogWriterAgent } from "../agents/changelog/changelog-writer-agent";
import { changelogEditorAgent } from "../agents/changelog/changelog-editor-agent";

const CreateNewContentWorkflowInputSchema = z.object({
   userId: z.string(),
   request: ContentRequestSchema,
});
const writingType = z
   .string()
   .describe("The detailed draft of the content, ready for editing");

const editorType = z.string().describe("The edited content, ready for review");

const ContentWritingStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      writing: writingType,
   });
const contentWritingStep = createStep({
   id: "content-writing-step",
   description: "Write the content based on the content strategy and research",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentWritingStepOutputSchema,
   execute: async ({ inputData }) => {
      const { userId, request } = inputData;
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
         userId,
         request,
      };
   },
});
const ContentEditorStepOutputSchema =
   CreateNewContentWorkflowInputSchema.extend({
      editor: editorType,
   });
const contentEditorStep = createStep({
   id: "content-editor-step",
   description: "Edit the content based on the content research",
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
         editor: result.object.editor,
         userId,
         request,
      };
   },
});

export const createNewChangelogWorkflow = createWorkflow({
   id: "create-new-changelog-workflow",
   description: "Create a new piece of content",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentEditorStepOutputSchema,
})
   .then(contentWritingStep)
   .then(contentEditorStep)
   .commit();
