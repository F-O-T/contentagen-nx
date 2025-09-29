import { createStep, createWorkflow } from "@mastra/core";
import { z } from "zod";
import { ContentRequestSchema } from "@packages/database/schema";
import { APIError, AppError, propagateError } from "@packages/utils/errors";
import { changelogWriterAgent } from "../../agents/changelog/changelog-writer-agent";
import { changelogEditorAgent } from "../../agents/changelog/changelog-editor-agent";
import { changelogReaderAgent } from "../../agents/changelog/changelog-reader-agent";
import { emitContentStatusChanged } from "@packages/server-events";
import { createDb } from "@packages/database/client";
import { updateContent } from "@packages/database/repositories/content-repository";
import { serverEnv } from "@packages/environment/server";

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

         // Update content status and emit event when writing starts
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
         throw error;
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
      keywords: z
         .array(z.string())
         .describe("The associeated keywords of the content"),
      sources: z.array(z.string()).describe("The sources found on the search"),
      metaDescription: z
         .string()
         .describe(
            "The meta description, being a SEO optmizaed description of the article",
         ),
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
                  keywords: true,
                  metaDescription: true,
               }),
            },
         );
         if (!result.object.metaDescription) {
            throw AppError.validation(
               'Agent output is missing "metaDescription" field',
            );
         }
         if (!result?.object.rating) {
            throw AppError.validation('Agent output is missing "review" field');
         }
         if (!result?.object.keywords) {
            throw AppError.validation('Agent output is missing "review" field');
         }
         if (!result?.object.rating) {
            throw AppError.validation('Agent output is missing "review" field');
         }
         if (!result?.object.reasonOfTheRating) {
            throw AppError.validation(
               'Agent output is missing "reasonOfTheRating" field',
            );
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
            metaDescription: result.object.metaDescription,
            userId,
            agentId,
            contentId,
            request,
            keywords: result.object.keywords,
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

export const createNewChangelogWorkflow = createWorkflow({
   id: "create-new-changelog-workflow",
   description: "Create a new changelog",
   inputSchema: CreateNewContentWorkflowInputSchema,
   outputSchema: ContentReviewerStepOutputSchema,
   retryConfig: {
      attempts: 3,
   },
})
   .then(changelogWritingStep)
   .then(changelogEditorStep)
   .then(changelogReadAndReviewStep)
   .commit();
